export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * This function takes an image source and a pixel crop object and returns
 * a base64 encoded string of the cropped image.
 */
export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: PixelCrop,
): Promise<string> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

  // Calculate destination dimensions (resize if too large)
  const MAX_DIMENSION = 800;
  let width = pixelCrop.width;
  let height = pixelCrop.height;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.floor(width * ratio);
    height = Math.floor(height * ratio);
  }

  // set canvas width to match the desired output
  canvas.width = width
  canvas.height = height

  // draw the cropped image onto the canvas, scaling if necessary
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    width,
    height
  )

  // As Base64 string
  // We use JPEG with reasonable quality to keep size down
  return canvas.toDataURL('image/jpeg', 0.7)
}