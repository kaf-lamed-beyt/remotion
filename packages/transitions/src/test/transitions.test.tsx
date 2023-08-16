import { test } from "vitest";
import { renderToString } from "react-dom/server";
import { TransitionSeries } from "../TransitionSeries.js";
import { AbsoluteFill, Internals } from "remotion";
import { fade } from "../presentations/fade.js";
import { linearTiming } from "../timings/linear.js";
import { makeMockCompositionManagerContext } from "@remotion/test-utils";

const renderForFrame = (frame: number, markup: React.ReactNode) => {
  return renderToString(
    <Internals.CanUseRemotionHooksProvider>
      <Internals.CompositionManager.Provider
        value={makeMockCompositionManagerContext()}
      >
        <Internals.Timeline.TimelineContext.Provider
          value={{
            rootId: "",
            frame: {
              "my-comp": frame,
            },
            playing: false,
            imperativePlaying: {
              current: false,
            },
            playbackRate: 1,
            setPlaybackRate: () => {
              throw new Error("playback rate");
            },
            audioAndVideoTags: { current: [] },
          }}
        >
          {markup}
        </Internals.Timeline.TimelineContext.Provider>
      </Internals.CompositionManager.Provider>
    </Internals.CanUseRemotionHooksProvider>
  );
};

const Letter: React.FC<{
  children: React.ReactNode;
  color: string;
}> = ({ children, color }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: color,
        opacity: 0.9,
        justifyContent: "center",
        alignItems: "center",
        fontSize: 200,
        color: "white",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

test("Transitions", () => {
  renderForFrame(
    10,
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={60}>
        <Letter color="green">C</Letter>
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade({})}
        timing={linearTiming({
          durationInFrames: 40,
        })}
      />
      <TransitionSeries.Transition
        presentation={fade({})}
        timing={linearTiming({
          durationInFrames: 40,
        })}
      />
    </TransitionSeries>
  );
});
