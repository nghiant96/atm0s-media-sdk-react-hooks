"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/lib.tsx
var lib_exports = {};
__export(lib_exports, {
  Atm0sMediaProvider: () => Atm0sMediaProvider,
  Consumer: () => Consumer,
  Context: () => Context,
  Publisher: () => Publisher,
  useConsumer: () => useConsumer,
  useConsumerStatus: () => useConsumerStatus,
  useConsumerVoiceActivity: () => useConsumerVoiceActivity,
  useMessageChannel: () => useMessageChannel,
  useMixer: () => useMixer,
  useMixerPeerVoiceActivity: () => useMixerPeerVoiceActivity,
  usePublisher: () => usePublisher,
  usePublisherStatus: () => usePublisherStatus,
  useRemoteAudioTracks: () => useRemoteAudioTracks,
  useRemotePeers: () => useRemotePeers,
  useRemoteTracks: () => useRemoteTracks,
  useRemoteVideoTracks: () => useRemoteVideoTracks,
  useRoom: () => useRoom,
  useSession: () => useSession
});
module.exports = __toCommonJS(lib_exports);

// src/context.ts
var import_react_native_webrtc = require("react-native-webrtc");
var import_core = require("@atm0s-media-sdk/core");
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
var Context = class extends import_core.EventEmitter {
  constructor(gateway, cfg, prepareAudioReceivers = 1, prepareVideoReceivers = 1) {
    super();
    this.prepareAudioReceivers = prepareAudioReceivers;
    this.prepareVideoReceivers = prepareVideoReceivers;
    this.session = new import_core.Session(gateway, cfg);
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
      this.free_audio_receivers.push(this.session.receiver(import_core.Kind.AUDIO));
    }
    for (let i = 0; i < (this.prepareVideoReceivers || 0); i++) {
      console.log("[SessionContext] prepare video receiver", i);
      this.free_video_receivers.push(this.session.receiver(import_core.Kind.VIDEO));
    }
    this.session.on(import_core.SessionEvent.ROOM_PEER_JOINED, (peer) => {
      this.peers.set(peer.peer, peer);
      this.emit("peers.updated" /* PeersUpdated */);
    });
    this.session.on(import_core.SessionEvent.ROOM_PEER_LEAVED, (peer) => {
      this.peers.delete(peer.peer);
      this.emit("peers.updated" /* PeersUpdated */);
    });
    this.session.on(
      import_core.SessionEvent.ROOM_TRACK_STARTED,
      (track) => {
        this.tracks.set(track.peer + "/" + track.track, track);
        this.emit("tracks.updated" /* TracksUpdated */);
        this.emit("peer.tracks.updated." /* PeerTracksUpdated */ + track.peer);
      }
    );
    this.session.on(
      import_core.SessionEvent.ROOM_TRACK_STOPPED,
      (track) => {
        this.tracks.delete(track.peer + "/" + track.track);
        this.emit("tracks.updated" /* TracksUpdated */);
        this.emit("peer.tracks.updated." /* PeerTracksUpdated */ + track.peer);
      }
    );
    this.session.on(import_core.SessionEvent.ROOM_CHANGED, (e) => {
      this.emit("room.updated" /* RoomUpdated */, e);
    });
  }
  get room() {
    return this.session.room;
  }
  takeReceiver(kind) {
    let receiver = kind == import_core.Kind.AUDIO ? this.free_audio_receivers.shift() : this.free_video_receivers.shift();
    if (receiver) {
      return receiver;
    }
    return this.session.receiver(kind);
  }
  backReceiver(receiver) {
    if (receiver.kind == import_core.Kind.AUDIO) {
      this.free_audio_receivers.push(receiver);
    } else {
      this.free_video_receivers.push(receiver);
    }
  }
  getOrCreatePublisher(name, media_or_kind, cfg) {
    let publisher = getKind(media_or_kind) == import_core.Kind.AUDIO ? this.audio_publisher.get(name) : this.video_publisher.get(name);
    if (!publisher) {
      let sender = this.session.sender(name, media_or_kind, cfg);
      publisher = new Publisher(sender);
      if (getKind(media_or_kind) == import_core.Kind.AUDIO) {
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
  if (media_or_kind instanceof import_react_native_webrtc.MediaStreamTrack) {
    return (0, import_core.stringToKind)(media_or_kind.kind);
  } else {
    return media_or_kind;
  }
}

// src/provider.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var Atm0sMediaContext = (0, import_react.createContext)({});
function Atm0sMediaProvider({
  children,
  gateway,
  cfg,
  prepareAudioReceivers,
  prepareVideoReceivers
}) {
  const [context, setContext] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
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
  return context ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Atm0sMediaContext.Provider, { value: context, children }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, {});
}

// src/hooks/session.tsx
var import_react2 = require("react");
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
  const ctx = (0, import_react2.useContext)(Atm0sMediaContext);
  return (0, import_react2.useMemo)(() => {
    return new SessionWrap(ctx);
  }, [ctx]);
}
function useRoom() {
  const ctx = (0, import_react2.useContext)(Atm0sMediaContext);
  const [room, setRoom] = (0, import_react2.useState)(() => ctx.room);
  (0, import_react2.useEffect)(() => {
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
var import_react3 = require("react");
var import_core2 = require("@atm0s-media-sdk/core");
function useMixer() {
  const ctx = (0, import_react3.useContext)(Atm0sMediaContext);
  return (0, import_react3.useMemo)(() => {
    return ctx.session.mixer;
  }, [ctx]);
}
function useMixerPeerVoiceActivity(peer) {
  const ctx = (0, import_react3.useContext)(Atm0sMediaContext);
  let [status, setStatus] = (0, import_react3.useState)(
    void 0
  );
  (0, import_react3.useEffect)(() => {
    const handler = (status2) => {
      setStatus(status2);
    };
    ctx.session.mixer?.on(import_core2.AudioMixerEvent.PEER_VOICE_ACTIVITY + peer, handler);
    return () => {
      ctx.session.mixer?.off(
        import_core2.AudioMixerEvent.PEER_VOICE_ACTIVITY + peer,
        handler
      );
    };
  }, [ctx]);
  return status;
}

// src/hooks/meta.tsx
var import_core3 = require("@atm0s-media-sdk/core");
var import_react4 = require("react");
function useRemotePeers() {
  const ctx = (0, import_react4.useContext)(Atm0sMediaContext);
  const [peers, setPeers] = (0, import_react4.useState)(() => Array.from(ctx.peers.values()));
  (0, import_react4.useEffect)(() => {
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
  const ctx = (0, import_react4.useContext)(Atm0sMediaContext);
  const [tracks, setTracks] = (0, import_react4.useState)(
    () => Array.from(ctx.tracks.values()).filter(
      (t) => (!peer || t.peer == peer) && (kind == void 0 || t.kind == kind)
    )
  );
  (0, import_react4.useEffect)(() => {
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
  return useRemoteTracks(peer, import_core3.Kind.AUDIO);
}
function useRemoteVideoTracks(peer) {
  return useRemoteTracks(peer, import_core3.Kind.VIDEO);
}

// src/hooks/publisher.tsx
var import_core4 = require("@atm0s-media-sdk/core");
var import_react5 = require("react");
function usePublisher(name, media_or_kind, cfg) {
  const ctx = (0, import_react5.useContext)(Atm0sMediaContext);
  return (0, import_react5.useMemo)(
    () => ctx.getOrCreatePublisher(name, media_or_kind, cfg),
    [name, media_or_kind, cfg]
  );
}
function usePublisherStatus(publisher) {
  let [status, setStatus] = (0, import_react5.useState)(() => publisher.sender.status);
  (0, import_react5.useEffect)(() => {
    const handler = (status2) => {
      setStatus(status2);
    };
    publisher.sender.on(import_core4.TrackSenderEvent.StatusUpdated, handler);
    return () => {
      publisher.sender.off(import_core4.TrackSenderEvent.StatusUpdated, handler);
    };
  }, [publisher]);
  return status;
}

// src/hooks/consumer.tsx
var import_react6 = require("react");
var import_core5 = require("@atm0s-media-sdk/core");
var import_react_native_webrtc2 = require("react-native-webrtc");
var Consumer = class extends import_core5.EventEmitter {
  constructor(ctx, track) {
    super();
    this.ctx = ctx;
    this.track = track;
  }
  receiver;
  media_stream = new import_react_native_webrtc2.MediaStream();
  get stream() {
    return this.media_stream;
  }
  async attach(cfg) {
    this.receiver = this.ctx.takeReceiver(this.track.kind);
    this.receiver.on(import_core5.TrackReceiverEvent.StatusUpdated, this.onStateEvent);
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
      this.receiver.off(import_core5.TrackReceiverEvent.StatusUpdated, this.onStateEvent);
      this.receiver = void 0;
      return receiver.detach();
    }
  }
  release() {
  }
  onStateEvent = (event) => {
    this.emit(import_core5.TrackReceiverEvent.StatusUpdated, event);
  };
};
function useConsumer(track) {
  const ctx = (0, import_react6.useContext)(Atm0sMediaContext);
  const consumer = (0, import_react6.useMemo)(() => new Consumer(ctx, track), [track]);
  (0, import_react6.useEffect)(() => {
    return () => {
      consumer.release();
    };
  }, [consumer]);
  return consumer;
}
function useConsumerStatus(consumer) {
  let [status, setStatus] = (0, import_react6.useState)(() => consumer.receiver?.status);
  (0, import_react6.useEffect)(() => {
    const handler = (status2) => {
      setStatus(status2);
    };
    consumer.on(import_core5.TrackReceiverEvent.StatusUpdated, handler);
    return () => {
      consumer.off(import_core5.TrackReceiverEvent.StatusUpdated, handler);
    };
  }, [consumer]);
  return status;
}
function useConsumerVoiceActivity(consumer) {
  let [status, setStatus] = (0, import_react6.useState)(
    void 0
  );
  (0, import_react6.useEffect)(() => {
    const handler = (status2) => {
      setStatus(status2);
    };
    consumer.on(import_core5.TrackReceiverEvent.VoiceActivity, handler);
    return () => {
      consumer.off(import_core5.TrackReceiverEvent.VoiceActivity, handler);
    };
  }, [consumer]);
  return status;
}

// src/hooks/msg_channel.tsx
var import_react7 = require("react");
function useMessageChannel(key, callback, config) {
  const ctx = (0, import_react7.useContext)(Atm0sMediaContext);
  const [channel, setChannel] = (0, import_react7.useState)(null);
  (0, import_react7.useEffect)(() => {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});
