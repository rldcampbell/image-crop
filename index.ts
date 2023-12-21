import sharp from "sharp";

type Dimensions = [width: number, height: number];
type Square = [x: number, y: number, size: number];

const getImageDimensions = async (path: string): Promise<Dimensions> => {
  const { width = 0, height = 0 } = await sharp(path).metadata();
  return [width, height];
};

const getBestSquares = ([width, height]: Dimensions): Square[] => {
  const aspectRatioFloor = ~~(width / height);
  const squareSizeFitWidth = ~~(width / (aspectRatioFloor + 1));
  const areaFitWidth =
    (aspectRatioFloor + 1) * squareSizeFitWidth * squareSizeFitWidth;
  const areaFitHeight = aspectRatioFloor * height * height;

  if (areaFitWidth >= areaFitHeight) {
    // fit squares to full width
    const y0 = ~~((height - squareSizeFitWidth) / 2);

    return new Array(aspectRatioFloor + 1)
      .fill(null)
      .map((_, i) => [i * squareSizeFitWidth, y0, squareSizeFitWidth]);
  }

  // fit squares to full height
  const x0 = ~~((width - aspectRatioFloor * height) / 2);

  return new Array(aspectRatioFloor)
    .fill(null)
    .map((_, i) => [x0 + i * height, 0, height]);
};

const cropToFile = (
  inputPath: string,
  [left, top, size]: Square,
  outputPath: string
) =>
  sharp(inputPath)
    .extract({ left, top, width: size, height: size })
    .toFile(outputPath);

const splitImage = async (path: string, prefix: string) => {
  const dimensions = await getImageDimensions(path);
  let i = 0;

  for (const square of getBestSquares(dimensions)) {
    const outputPath = `${prefix}${i++}.jpg`;

    await cropToFile(path, square, outputPath);

    console.log(`Created '${outputPath}'.`);
  }
};

// run
const imagePath = "./sourceImages/penarth.jpg";
const outputPathPrefix = "./splitImages/penarth_";

await splitImage(imagePath, outputPathPrefix)
  .catch(console.error)
  .then(() => {
    console.log("Done.");
  });
