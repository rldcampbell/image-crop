import sharp from "sharp";

type Dimensions = [width: number, height: number];
type Square = [x: number, y: number, size: number];

const getImageDimensions = async (path: string): Promise<Dimensions> => {
  try {
    const metadata = await sharp(path).metadata();
    return [metadata.width || 0, metadata.height || 0];
  } catch (error) {
    console.error("Error extracting image dimensions:", error);
    throw error;
  }
};

const getAspectRatio = ([width, height]: Dimensions) => width / height;

const getBestSquares = (dimensions: Dimensions): Square[] => {
  const [width, height] = dimensions;
  const aspectRatio = getAspectRatio(dimensions);
  const aspectRatioCeil = Math.ceil(aspectRatio);
  const squareSizeA = ~~(width / aspectRatioCeil);
  const areaA = aspectRatioCeil * squareSizeA * squareSizeA;
  const areaB = (aspectRatioCeil - 1) * height * height;
  if (areaA >= areaB) {
    const y0 = ~~((height - squareSizeA) / 2);

    return new Array(aspectRatioCeil)
      .fill(null)
      .map((_, i) => [i * squareSizeA, y0, squareSizeA]);
  }

  const x0 = ~~((width - (aspectRatioCeil - 1) * height) / 2);

  return new Array(aspectRatioCeil - 1)
    .fill(null)
    .map((_, i) => [x0 + i * height, 0, height]);
};

const cropToFile = async (
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

await splitImage(imagePath, outputPathPrefix);

console.log("Done.");
