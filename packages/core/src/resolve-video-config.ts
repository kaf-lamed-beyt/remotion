import type {AnyComposition} from './CompositionManager.js';
import type {VideoConfig} from './video-config.js';

export const resolveVideoConfig = async (
	comp: AnyComposition
): Promise<VideoConfig> => {
	const calculated = comp.calculateMetadata
		? await comp.calculateMetadata(comp.defaultProps)
		: null;

	const width = calculated?.width ?? comp.width ?? null;
	if (!width) {
		throw new TypeError(
			'Composition width was neither specified via the `width` prop nor the `calculateMetadata` function.'
		);
	}

	const height = calculated?.height ?? comp.height ?? null;
	if (!height) {
		throw new TypeError(
			'Composition height was neither specified via the `height` prop nor the `calculateMetadata` function.'
		);
	}

	const fps = calculated?.fps ?? comp.fps ?? null;
	if (!fps) {
		throw new TypeError(
			'Composition fps was neither specified via the `fps` prop nor the `calculateMetadata` function.'
		);
	}

	const durationInFrames =
		calculated?.durationInFrames ?? comp.durationInFrames ?? null;
	if (!durationInFrames) {
		throw new TypeError(
			'Composition durationInFrames was neither specified via the `durationInFrames` prop nor the `calculateMetadata` function.'
		);
	}

	return {
		width,
		height,
		fps,
		durationInFrames,
		id: comp.id,
		defaultProps: comp.defaultProps,
	};
};
