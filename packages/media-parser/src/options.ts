import type {} from './boxes/iso-base-media/mdat/mdat';
import type {Dimensions} from './get-dimensions';
import type {
	AudioTrack,
	MediaParserAudioCodec,
	MediaParserVideoCodec,
	VideoTrack,
} from './get-tracks';
import type {AnySegment} from './parse-result';
import type {InternalStats} from './parser-state';
import type {ReaderInterface} from './readers/reader';
import type {OnAudioTrack, OnVideoTrack} from './webcodec-sample-types';

export type KnownAudioCodecs =
	| 'aac'
	| 'mp3'
	| 'aiff'
	| 'opus'
	| 'pcm'
	| 'vorbis'
	| 'unknown';

export type ParseMediaFields = {
	dimensions: boolean;
	durationInSeconds: boolean;
	boxes: boolean;
	fps: boolean;
	videoCodec: boolean;
	audioCodec: boolean;
	tracks: boolean;
	rotation: boolean;
	unrotatedDimensions: boolean;
	internalStats: boolean;
	size: boolean;
	name: boolean;
};

export type Options<Fields extends ParseMediaFields> = {
	dimensions?: Fields['dimensions'];
	durationInSeconds?: Fields['durationInSeconds'];
	boxes?: Fields['boxes'];
	fps?: Fields['fps'];
	videoCodec?: Fields['videoCodec'];
	audioCodec?: Fields['audioCodec'];
	tracks?: Fields['tracks'];
	rotation?: Fields['rotation'];
	unrotatedDimensions?: Fields['unrotatedDimensions'];
	internalStats?: Fields['internalStats'];
	size?: Fields['size'];
	name?: Fields['name'];
};

export type ParseMediaResult<Fields extends Options<ParseMediaFields>> =
	(Fields['dimensions'] extends true ? {dimensions: Dimensions} : {}) &
		(Fields['durationInSeconds'] extends true
			? {durationInSeconds: number | null}
			: {}) &
		(Fields['boxes'] extends true ? {boxes: AnySegment[]} : {}) &
		(Fields['fps'] extends true ? {fps: number | null} : {}) &
		(Fields['videoCodec'] extends true
			? {videoCodec: MediaParserVideoCodec | null}
			: {}) &
		(Fields['audioCodec'] extends true
			? {audioCodec: MediaParserAudioCodec | null}
			: {}) &
		(Fields['tracks'] extends true
			? {videoTracks: VideoTrack[]; audioTracks: AudioTrack[]}
			: {}) &
		(Fields['rotation'] extends true ? {rotation: number | null} : {}) &
		(Fields['unrotatedDimensions'] extends true
			? {unrotatedDimensions: Dimensions}
			: {}) &
		(Fields['internalStats'] extends true
			? {internalStats: InternalStats}
			: {}) &
		(Fields['size'] extends true ? {size: number | null} : {}) &
		(Fields['name'] extends true ? {name: string} : {});

export type ParseMedia = <F extends Options<ParseMediaFields>>(options: {
	src: string | File;
	fields?: F;
	reader?: ReaderInterface;
	onAudioTrack?: OnAudioTrack;
	onVideoTrack?: OnVideoTrack;
	signal?: AbortSignal;
}) => Promise<ParseMediaResult<F>>;
