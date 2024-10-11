// src/context.ts
import {
  MediaStreamTrack
} from "react-native-webrtc";
import {
  Session,
  EventEmitter,
  SessionEvent,
  Kind,
  stringToKind
} from "@atm0s-media-sdk/core";
var Publisher = class {
  constructor(_sender) {
    this._sender = _sender;
  }
  get sender() {
    return this._sender;
  }
  get attached() {
    return this._sender.attached;
  }
  async attach(track) {
    await this._sender.attach(track);
  }
  async config(config) {
    await this._sender.config(config);
  }
  async detach() {
    await this._sender.detach();
  }
};
var Context = class extends EventEmitter {
  constructor(gateway, cfg, prepareAudioReceivers = 1, prepareVideoReceivers = 1) {
    super();
    this.prepareAudioReceivers = prepareAudioReceivers;
    this.prepareVideoReceivers = prepareVideoReceivers;
    this.session = new Session(gateway, cfg);
    this.init();
  }
  session;
  peers = /* @__PURE__ */ new Map();
  tracks = /* @__PURE__ */ new Map();
  free_audio_receivers = [];
  free_video_receivers = [];
  audio_publisher = /* @__PURE__ */ new Map();
  video_publisher = /* @__PURE__ */ new Map();
  init() {
    for (let i = 0; i < (this.prepareAudioReceivers || 0); i++) {
      console.log("[SessionContext] prepare audio reicever", i);
      this.free_audio_receivers.push(this.session.receiver(Kind.AUDIO));
    }
    for (let i = 0; i < (this.prepareVideoReceivers || 0); i++) {
      console.log("[SessionContext] prepare video receiver", i);
      this.free_video_receivers.push(this.session.receiver(Kind.VIDEO));
    }
    this.session.on(SessionEvent.ROOM_PEER_JOINED, (peer) => {
      this.peers.set(peer.peer, peer);
      this.emit("peers.updated" /* PeersUpdated */);
    });
    this.session.on(SessionEvent.ROOM_PEER_LEAVED, (peer) => {
      this.peers.delete(peer.peer);
      this.emit("peers.updated" /* PeersUpdated */);
    });
    this.session.on(
      SessionEvent.ROOM_TRACK_STARTED,
      (track) => {
        this.tracks.set(track.peer + "/" + track.track, track);
        this.emit("tracks.updated" /* TracksUpdated */);
        this.emit("peer.tracks.updated." /* PeerTracksUpdated */ + track.peer);
      }
    );
    this.session.on(
      SessionEvent.ROOM_TRACK_STOPPED,
      (track) => {
        this.tracks.delete(track.peer + "/" + track.track);
        this.emit("tracks.updated" /* TracksUpdated */);
        this.emit("peer.tracks.updated." /* PeerTracksUpdated */ + track.peer);
      }
    );
    this.session.on(SessionEvent.ROOM_CHANGED, (e) => {
      this.emit("room.updated" /* RoomUpdated */, e);
    });
  }
  get room() {
    return this.session.room;
  }
  takeReceiver(kind) {
    let receiver = kind == Kind.AUDIO ? this.free_audio_receivers.shift() : this.free_video_receivers.shift();
    if (receiver) {
      return receiver;
    }
    return this.session.receiver(kind);
  }
  backReceiver(receiver) {
    if (receiver.kind == Kind.AUDIO) {
      this.free_audio_receivers.push(receiver);
    } else {
      this.free_video_receivers.push(receiver);
    }
  }
  getOrCreatePublisher(name, media_or_kind, cfg) {
    let publisher = getKind(media_or_kind) == Kind.AUDIO ? this.audio_publisher.get(name) : this.video_publisher.get(name);
    if (!publisher) {
      let sender = this.session.sender(name, media_or_kind, cfg);
      publisher = new Publisher(sender);
      if (getKind(media_or_kind) == Kind.AUDIO) {
        this.audio_publisher.set(name, publisher);
      } else {
        this.video_publisher.set(name, publisher);
      }
      return publisher;
    } else {
      return publisher;
    }
  }
  connect(version) {
    return this.session.connect(version);
  }
  restartIce() {
    return this.session.restartIce();
  }
  async join(info, token) {
    await this.session.join(info, token);
  }
  async leave() {
    await this.session.leave();
  }
  disconnect() {
    this.session.disconnect();
  }
};
function getKind(media_or_kind) {
  if (media_or_kind instanceof MediaStreamTrack) {
    return stringToKind(media_or_kind.kind);
  } else {
    return media_or_kind;
  }
}

// src/provider.tsx
import { createContext, useEffect, useState } from "react";
import { Fragment, jsx } from "react/jsx-runtime";
var Atm0sMediaContext = createContext({});
function Atm0sMediaProvider({
  children,
  gateway,
  cfg,
  prepareAudioReceivers,
  prepareVideoReceivers
}) {
  const [context, setContext] = useState(null);
  useEffect(() => {
    const context2 = new Context(
      gateway,
      cfg,
      prepareAudioReceivers,
      prepareVideoReceivers
    );
    setContext(context2);
    return () => {
      context2.disconnect();
    };
  }, [setContext]);
  return context ? /* @__PURE__ */ jsx(Atm0sMediaContext.Provider, { value: context, children }) : /* @__PURE__ */ jsx(Fragment, {});
}

// src/hooks/session.tsx
import { useContext, useEffect as useEffect2, useMemo, useState as useState2 } from "react";
var VERSION = "react@0.0.0";
var SessionWrap = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  connect = () => {
    return this.ctx.connect(VERSION);
  };
  restartIce = () => {
    return this.ctx.restartIce();
  };
  join = async (info, token) => {
    await this.ctx.join(info, token);
  };
  leave = async () => {
    await this.ctx.leave();
  };
  disconnect = () => {
    this.ctx.disconnect();
  };
};
function useSession() {
  const ctx = useContext(Atm0sMediaContext);
  return useMemo(() => {
    return new SessionWrap(ctx);
  }, [ctx]);
}
function useRoom() {
  const ctx = useContext(Atm0sMediaContext);
  const [room, setRoom] = useState2(() => ctx.room);
  useEffect2(() => {
    const handler = (room2) => {
      setRoom(room2);
    };
    ctx.on("room.updated" /* RoomUpdated */, handler);
    return () => {
      ctx.off("room.updated" /* RoomUpdated */, handler);
    };
  }, [ctx]);
  return room;
}

// src/hooks/mixer.tsx
import { useContext as useContext2, useState as useState3, useMemo as useMemo2, useEffect as useEffect3 } from "react";
import {
  AudioMixerEvent
} from "@atm0s-media-sdk/core";
function useMixer() {
  const ctx = useContext2(Atm0sMediaContext);
  return useMemo2(() => {
    return ctx.session.mixer;
  }, [ctx]);
}
function useMixerPeerVoiceActivity(peer) {
  const ctx = useContext2(Atm0sMediaContext);
  let [status, setStatus] = useState3(
    void 0
  );
  useEffect3(() => {
    const handler = (status2) => {
      setStatus(status2);
    };
    ctx.session.mixer?.on(AudioMixerEvent.PEER_VOICE_ACTIVITY + peer, handler);
    return () => {
      ctx.session.mixer?.off(
        AudioMixerEvent.PEER_VOICE_ACTIVITY + peer,
        handler
      );
    };
  }, [ctx]);
  return status;
}

// src/hooks/meta.tsx
import { Kind as Kind2 } from "@atm0s-media-sdk/core";
import { useContext as useContext3, useEffect as useEffect4, useState as useState4 } from "react";
function useRemotePeers() {
  const ctx = useContext3(Atm0sMediaContext);
  const [peers, setPeers] = useState4(() => Array.from(ctx.peers.values()));
  useEffect4(() => {
    const handler = () => {
      let peers2 = Array.from(ctx.peers.values());
      setPeers(peers2);
    };
    handler();
    ctx.on("peers.updated" /* PeersUpdated */, handler);
    return () => {
      ctx.off("peers.updated" /* PeersUpdated */, handler);
    };
  }, [ctx]);
  return peers;
}
function useRemoteTracks(peer, kind) {
  const ctx = useContext3(Atm0sMediaContext);
  const [tracks, setTracks] = useState4(
    () => Array.from(ctx.tracks.values()).filter(
      (t) => (!peer || t.peer == peer) && (kind == void 0 || t.kind == kind)
    )
  );
  useEffect4(() => {
    const handler = () => {
      let tracks2 = Array.from(ctx.tracks.values()).filter(
        (t) => (!peer || t.peer == peer) && (kind == void 0 || t.kind == kind)
      );
      setTracks(tracks2);
    };
    handler();
    ctx.on(
      peer ? "peer.tracks.updated." /* PeerTracksUpdated */ + peer : "tracks.updated" /* TracksUpdated */,
      handler
    );
    return () => {
      ctx.off(
        peer ? "peer.tracks.updated." /* PeerTracksUpdated */ + peer : "tracks.updated" /* TracksUpdated */,
        handler
      );
    };
  }, [ctx, peer]);
  return tracks;
}
function useRemoteAudioTracks(peer) {
  return useRemoteTracks(peer, Kind2.AUDIO);
}
function useRemoteVideoTracks(peer) {
  return useRemoteTracks(peer, Kind2.VIDEO);
}

// src/hooks/publisher.tsx
import {
  TrackSenderEvent
} from "@atm0s-media-sdk/core";
import { useContext as useContext4, useEffect as useEffect5, useMemo as useMemo3, useState as useState5 } from "react";
function usePublisher(name, media_or_kind, cfg) {
  const ctx = useContext4(Atm0sMediaContext);
  return useMemo3(
    () => ctx.getOrCreatePublisher(name, media_or_kind, cfg),
    [name, media_or_kind, cfg]
  );
}
function usePublisherStatus(publisher) {
  let [status, setStatus] = useState5(() => publisher.sender.status);
  useEffect5(() => {
    const handler = (status2) => {
      setStatus(status2);
    };
    publisher.sender.on(TrackSenderEvent.StatusUpdated, handler);
    return () => {
      publisher.sender.off(TrackSenderEvent.StatusUpdated, handler);
    };
  }, [publisher]);
  return status;
}

// src/hooks/consumer.tsx
import { useContext as useContext5, useEffect as useEffect6, useMemo as useMemo4, useState as useState6 } from "react";
import {
  EventEmitter as EventEmitter2,
  TrackReceiverEvent
} from "@atm0s-media-sdk/core";
import {
  MediaStream
} from "react-native-webrtc";
var Consumer = class extends EventEmitter2 {
  constructor(ctx, track) {
    super();
    this.ctx = ctx;
    this.track = track;
  }
  receiver;
  media_stream = new MediaStream();
  get stream() {
    return this.media_stream;
  }
  async attach(cfg) {
    this.receiver = this.ctx.takeReceiver(this.track.kind);
    this.receiver.on(TrackReceiverEvent.StatusUpdated, this.onStateEvent);
    this.media_stream.getTracks().map((t) => this.media_stream.removeTrack(t));
    this.receiver.stream.getTracks().map((t) => this.media_stream.addTrack(t));
    return this.receiver.attach(this.track, cfg);
  }
  async config(cfg) {
    return this.receiver?.config(cfg);
  }
  async detach() {
    if (this.receiver) {
      let receiver = this.receiver;
      this.ctx.backReceiver(receiver);
      this.receiver.off(TrackReceiverEvent.StatusUpdated, this.onStateEvent);
      this.receiver = void 0;
      return receiver.detach();
    }
  }
  release() {
  }
  onStateEvent = (event) => {
    this.emit(TrackReceiverEvent.StatusUpdated, event);
  };
};
function useConsumer(track) {
  const ctx = useContext5(Atm0sMediaContext);
  const consumer = useMemo4(() => new Consumer(ctx, track), [track]);
  useEffect6(() => {
    return () => {
      consumer.release();
    };
  }, [consumer]);
  return consumer;
}
function useConsumerStatus(consumer) {
  let [status, setStatus] = useState6(() => consumer.receiver?.status);
  useEffect6(() => {
    const handler = (status2) => {
      setStatus(status2);
    };
    consumer.on(TrackReceiverEvent.StatusUpdated, handler);
    return () => {
      consumer.off(TrackReceiverEvent.StatusUpdated, handler);
    };
  }, [consumer]);
  return status;
}
function useConsumerVoiceActivity(consumer) {
  let [status, setStatus] = useState6(
    void 0
  );
  useEffect6(() => {
    const handler = (status2) => {
      setStatus(status2);
    };
    consumer.on(TrackReceiverEvent.VoiceActivity, handler);
    return () => {
      consumer.off(TrackReceiverEvent.VoiceActivity, handler);
    };
  }, [consumer]);
  return status;
}

// src/hooks/msg_channel.tsx
import { useContext as useContext6, useEffect as useEffect7, useState as useState7 } from "react";
function useMessageChannel(key, callback, config) {
  const ctx = useContext6(Atm0sMediaContext);
  const [channel, setChannel] = useState7(null);
  useEffect7(() => {
    ctx.session.createMessageChannel(key, config).then((_chan) => {
      _chan.on("message", callback);
      setChannel(_chan);
    });
    return () => {
      if (channel) {
        channel.off("message", callback);
        channel.close();
      }
    };
  }, [key, config]);
  return channel;
}
export {
  Atm0sMediaProvider,
  Consumer,
  Context,
  Publisher,
  useConsumer,
  useConsumerStatus,
  useConsumerVoiceActivity,
  useMessageChannel,
  useMixer,
  useMixerPeerVoiceActivity,
  usePublisher,
  usePublisherStatus,
  useRemoteAudioTracks,
  useRemotePeers,
  useRemoteTracks,
  useRemoteVideoTracks,
  useRoom,
  useSession
};
