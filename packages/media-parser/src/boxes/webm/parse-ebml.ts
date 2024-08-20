import {registerTrack} from '../../add-new-matroska-tracks';
import {type BufferIterator} from '../../buffer-iterator';
import type {ParserContext} from '../../parser-context';
import type {VideoSample} from '../../webcodec-sample-types';
import {getSampleFromBlock} from './get-sample-from-block';
import {getTrack} from './get-track';
import type {PossibleEbml} from './segments/all-segments';
import {ebmlMap} from './segments/all-segments';

export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

export const parseEbml = async (
	iterator: BufferIterator,
	parserContext: ParserContext,
): Promise<Prettify<PossibleEbml>> => {
	const hex = iterator.getMatroskaSegmentId();
	if (hex === null) {
		throw new Error(
			'Not enough bytes left to parse EBML - this should not happen',
		);
	}

	const hasInMap = ebmlMap[hex as keyof typeof ebmlMap];
	if (!hasInMap) {
		throw new Error(
			`Don't know how to parse EBML hex ID ${JSON.stringify(hex)}`,
		);
	}

	const size = iterator.getVint();
	if (size === null) {
		throw new Error(
			'Not enough bytes left to parse EBML - this should not happen',
		);
	}

	if (hasInMap.type === 'uint') {
		const value = iterator.getUint(size);

		return {type: hasInMap.name, value};
	}

	if (hasInMap.type === 'string') {
		const value = iterator.getByteString(size);

		return {
			type: hasInMap.name,
			value,
		};
	}

	if (hasInMap.type === 'float') {
		const value = size === 4 ? iterator.getFloat32() : iterator.getFloat64();

		return {
			type: hasInMap.name,
			value,
		};
	}

	if (hasInMap.type === 'void') {
		iterator.discard(size);

		return {
			type: hasInMap.name,
			value: undefined,
		};
	}

	if (hasInMap.type === 'hex-string') {
		return {
			type: hasInMap.name,
			value:
				'0x' +
				[...iterator.getSlice(size)]
					.map((b) => b.toString(16).padStart(2, '0'))
					.join(''),
		};
	}

	if (hasInMap.type === 'uint8array') {
		return {
			type: hasInMap.name,
			value: iterator.getSlice(size),
		};
	}

	if (hasInMap.type === 'children') {
		const children: PossibleEbml[] = [];
		const startOffset = iterator.counter.getOffset();

		// eslint-disable-next-line no-constant-condition
		while (true) {
			const offset = iterator.counter.getOffset();
			const value = await parseEbml(iterator, parserContext);
			const remapped = await postprocessEbml({
				offset,
				ebml: value,
				parserContext,
			});
			children.push(remapped);

			const offsetNow = iterator.counter.getOffset();

			if (offsetNow - startOffset > size) {
				throw new Error(
					`Offset ${offsetNow - startOffset} is larger than the length of the hex ${size}`,
				);
			}

			if (offsetNow - startOffset === size) {
				break;
			}
		}

		return {type: hasInMap.name, value: children};
	}

	// @ts-expect-error
	throw new Error(`Unknown segment type ${hasInMap.type}`);
};

export const postprocessEbml = async ({
	offset,
	ebml,
	parserContext,
}: {
	offset: number;
	ebml: Prettify<PossibleEbml>;
	parserContext: ParserContext;
}): Promise<Prettify<PossibleEbml>> => {
	if (ebml.type === 'TimestampScale') {
		parserContext.parserState.setTimescale(ebml.value);
	}

	if (ebml.type === 'TrackEntry') {
		parserContext.parserState.onTrackEntrySegment(ebml);

		const track = getTrack({
			track: ebml,
			timescale: parserContext.parserState.getTimescale(),
		});

		if (track) {
			await registerTrack({
				state: parserContext.parserState,
				options: parserContext,
				track,
			});
		}
	}

	if (ebml.type === 'Timestamp') {
		parserContext.parserState.setTimestampOffset(offset, ebml.value);
	}

	if (ebml.type === 'Block' || ebml.type === 'SimpleBlock') {
		const sample = getSampleFromBlock(ebml, parserContext, offset);

		if (sample.type === 'video-sample') {
			await parserContext.parserState.onVideoSample(
				sample.videoSample.trackId,
				sample.videoSample,
			);
			return {
				type: 'Block',
				value: new Uint8Array([]),
			};
		}

		if (sample.type === 'audio-sample') {
			await parserContext.parserState.onAudioSample(
				sample.audioSample.trackId,
				sample.audioSample,
			);
			return {
				type: 'Block',
				value: new Uint8Array([]),
			};
		}

		if (sample.type === 'no-sample') {
			return {
				type: 'Block',
				value: new Uint8Array([]),
			};
		}
	}

	if (ebml.type === 'BlockGroup') {
		// Blocks don't have information about keyframes.
		// https://ffmpeg.org/pipermail/ffmpeg-devel/2015-June/173825.html
		// "For Blocks, keyframes is
		// inferred by the absence of ReferenceBlock element (as done by matroskadec).""

		const block = ebml.value.find(
			(c) => c.type === 'SimpleBlock' || c.type === 'Block',
		);
		if (!block || (block.type !== 'SimpleBlock' && block.type !== 'Block')) {
			throw new Error('Expected block segment');
		}

		const hasReferenceBlock = ebml.value.find(
			(c) => c.type === 'ReferenceBlock',
		);

		const sample =
			block.value.length === 0
				? null
				: getSampleFromBlock(block, parserContext, offset);

		if (sample && sample.type === 'partial-video-sample') {
			const completeFrame: VideoSample = {
				...sample.partialVideoSample,
				type: hasReferenceBlock ? 'delta' : 'key',
			};
			await parserContext.parserState.onVideoSample(
				sample.partialVideoSample.trackId,
				completeFrame,
			);
		}

		return {
			type: 'BlockGroup',
			value: [],
		};
	}

	return ebml;
};
