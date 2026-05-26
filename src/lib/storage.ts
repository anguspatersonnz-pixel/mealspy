import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Listing } from "./data";

export type SellerApplication = {
  id: string;
  type: "venue" | "maker";
  businessName: string;
  contactEmail: string;
  licence: string;
  region: string;
  createdAt: string;
  status: "received";
};

const dataDir = path.join(process.cwd(), ".data");
const listingsFile = path.join(dataDir, "listings.json");
const applicationsFile = path.join(dataDir, "applications.json");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const text = await readFile(file, "utf8");
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2));
}

export async function getSubmittedListings() {
  return readJson<Listing[]>(listingsFile, []);
}

export async function addSubmittedListing(listing: Listing) {
  const listings = await getSubmittedListings();
  const next = [listing, ...listings];
  await writeJson(listingsFile, next);
  return listing;
}

export async function getApplications() {
  return readJson<SellerApplication[]>(applicationsFile, []);
}

export async function addApplication(application: SellerApplication) {
  const applications = await getApplications();
  const next = [application, ...applications];
  await writeJson(applicationsFile, next);
  return application;
}
