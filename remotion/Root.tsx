import { Composition } from "remotion";
import { ShortVideoComposition } from "./ShortVideoComposition";

export function ShortVideoRoot() {
  return (
    <>
      <Composition<any, any>
        id="ShortVideo"
        component={ShortVideoComposition}
        durationInFrames={900} // default 30s at 30fps — overridden at render time
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          videoUrl: "",
          startTime: 0,
          endTime: 30,
          captions: [],
          captionStyle: null,
        }}
        calculateMetadata={({ props }: { props: any }) => {
          const durationInFrames = Math.max(
            30,
            Math.round((props.endTime - props.startTime) * 30)
          );
          return { durationInFrames };
        }}
      />
    </>
  );
}
