import { MediaStreamTrack, MediaStream } from 'react-native-webrtc';
import * as _atm0s_media_sdk_core from '@atm0s-media-sdk/core';
import { BitrateControlMode, TrackSender, Sender_Config, EventEmitter, Session, RoomPeerJoined, RoomTrackStarted, TrackReceiver, SessionConfig, JoinInfo, Kind, AudioMixerPeerVoiceActivity, TrackSenderStatus, TrackReceiverStatus, TrackReceiverVoiceActivity, MessageChannelConfig, RoomMessageChannel } from '@atm0s-media-sdk/core';
export { AudioMixer } from '@atm0s-media-sdk/core';

interface PublisherConfig {
    priority: number;
    bitrate: BitrateControlMode;
    simulcast?: boolean;
}
declare class Publisher {
    private _sender;
    constructor(_sender: TrackSender);
    get sender(): TrackSender;
    get attached(): boolean;
    attach(track: MediaStreamTrack): Promise<void>;
    config(config: Sender_Config): Promise<void>;
    detach(): Promise<void>;
}
declare class Context extends EventEmitter {
    private prepareAudioReceivers;
    private prepareVideoReceivers;
    session: Session;
    peers: Map<string, RoomPeerJoined>;
    tracks: Map<string, RoomTrackStarted>;
    free_audio_receivers: TrackReceiver[];
    free_video_receivers: TrackReceiver[];
    audio_publisher: Map<string, Publisher>;
    video_publisher: Map<string, Publisher>;
    constructor(gateway: string, cfg: SessionConfig, prepareAudioReceivers?: number, prepareVideoReceivers?: number);
    init(): void;
    get room(): JoinInfo | undefined;
    takeReceiver(kind: Kind): TrackReceiver;
    backReceiver(receiver: TrackReceiver): void;
    getOrCreatePublisher(name: string, media_or_kind: Kind | MediaStreamTrack, cfg?: PublisherConfig): Publisher;
    connect(version: string): Promise<void>;
    restartIce(): Promise<void>;
    join(info: any, token: string): Promise<void>;
    leave(): Promise<void>;
    disconnect(): void;
}

interface Props {
    gateway: string;
    cfg: SessionConfig;
    prepareAudioReceivers?: number;
    prepareVideoReceivers?: number;
    children: JSX.Element;
}
declare function Atm0sMediaProvider({ children, gateway, cfg, prepareAudioReceivers, prepareVideoReceivers, }: Props): JSX.Element;

declare class SessionWrap {
    private ctx;
    constructor(ctx: Context);
    connect: () => Promise<void>;
    restartIce: () => Promise<void>;
    join: (info: any, token: string) => Promise<void>;
    leave: () => Promise<void>;
    disconnect: () => void;
}
declare function useSession(): SessionWrap;
declare function useRoom(): JoinInfo | undefined;

declare function useMixer(): _atm0s_media_sdk_core.AudioMixer | undefined;
declare function useMixerPeerVoiceActivity(peer: string): AudioMixerPeerVoiceActivity | undefined;

interface RemotePeer {
    peer: string;
}
interface RemoteTrack {
    peer: string;
    track: string;
    kind: Kind;
}
declare function useRemotePeers(): RemotePeer[];
declare function useRemoteTracks(peer?: string, kind?: Kind): RemoteTrack[];
declare function useRemoteAudioTracks(peer?: string): RemoteTrack[];
declare function useRemoteVideoTracks(peer?: string): RemoteTrack[];

declare function usePublisher(name: string, media_or_kind: Kind | MediaStreamTrack, cfg?: PublisherConfig): Publisher;
declare function usePublisherStatus(publisher: Publisher): TrackSenderStatus | undefined;

interface ConsumerConfig {
    priority: number;
    maxSpatial: number;
    maxTemporal: number;
}
declare class Consumer extends EventEmitter {
    private ctx;
    private track;
    receiver?: TrackReceiver;
    media_stream: MediaStream;
    constructor(ctx: Context, track: RemoteTrack);
    get stream(): MediaStream;
    attach(cfg: ConsumerConfig): Promise<void>;
    config(cfg: ConsumerConfig): Promise<void | undefined>;
    detach(): Promise<void>;
    release(): void;
    onStateEvent: (event: TrackReceiverStatus | undefined) => void;
}
declare function useConsumer(track: RemoteTrack): Consumer;
declare function useConsumerStatus(consumer: Consumer): TrackReceiverStatus | undefined;
declare function useConsumerVoiceActivity(consumer: Consumer): TrackReceiverVoiceActivity | undefined;

declare function useMessageChannel(key: string, callback: (event: {
    key: string;
    peer: string;
    message: Uint8Array | string;
}) => void, config?: MessageChannelConfig): RoomMessageChannel | null;

export { Atm0sMediaProvider, Consumer, type ConsumerConfig, Context, Publisher, type PublisherConfig, type RemotePeer, type RemoteTrack, useConsumer, useConsumerStatus, useConsumerVoiceActivity, useMessageChannel, useMixer, useMixerPeerVoiceActivity, usePublisher, usePublisherStatus, useRemoteAudioTracks, useRemotePeers, useRemoteTracks, useRemoteVideoTracks, useRoom, useSession };
