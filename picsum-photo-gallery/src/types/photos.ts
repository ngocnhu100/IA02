/**
 * Photo metadata returned by Picsum API.
 */
export interface Photo {
  /** String ID used in URLs (e.g. /id/{id}) */
  id: string;
  /** Author/photographer name */
  author: string;
  /** Original image width in pixels */
  width: number;
  /** Original image height in pixels */
  height: number;
  /** Page URL on Picsum */
  url: string;
  /** Direct download URL for the original image */
  download_url: string;
}
