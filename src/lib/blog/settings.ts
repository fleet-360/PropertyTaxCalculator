import dbConnect from '@/lib/mongodb';
import Settings from '@/lib/models/Settings';

/** Serialized site settings for public blog pages (Mongo + lean + JSON clone). */
export async function getBlogSiteSettings() {
  await dbConnect();
  const settings = await Settings.getSettings();
  return JSON.parse(JSON.stringify(settings));
}
