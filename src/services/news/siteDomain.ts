import { HydratedDocument } from "mongoose";
import SiteDomain from "../../models/Site";
import { SiteDomains } from "../../interfaces/site";
import { extractMainDomain } from "./extractor";
import { s3Image } from '../../services/put-s3-images.service';
import * as tld from 'tldjs';
import Site from "../../models/Site";

export const processSiteDomain = async (url: string) => {
	let domain = extractMainDomain(url); let size=512
	let domain_pretty = ''
	if (domain) {
		for (let i = 0; i < domain.length; i++) {
			if (domain[i] == '.') domain_pretty += '_'
			else domain_pretty += domain[i]
		}		
		let logoKey = `voxen/news/${domain_pretty}_favicon.jpg`
		let googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`
		let logoUrl = s3Image.s3Uri + logoKey
		let siteName = await getWebsiteName(domain) 
	
		await s3Image.putS3Image(googleFaviconUrl, logoKey);	
		await saveNewsSite(siteName ,url, domain, logoUrl)
		
		let siteDomain = await Site.findOne({ domain })
		return siteDomain
	} else {
		return null
	}
}

export async function getWebsiteName(domain: string): Promise<string> {
	const domainInfo = tld.parse(domain);
	if (domainInfo && domainInfo.domain) {
		const parts = domainInfo.domain.split('.');
		return parts[0];		
	} else {
		const parts = domain.split('.');
		return parts[0];		
	}
}

export const saveNewsSite = async (siteName: string, siteUrl: string, domain: string, logoUrl: string): Promise<HydratedDocument<SiteDomains>> => {
	const onDb = await SiteDomain.findOne({ siteUrl });
	if (onDb) {
	  let updatedData = { siteName, siteUrl, domain, logoUrl, updatedAt: new Date() }
	  return await onDb.overwrite(updatedData).save()
	} else {
	  let newData = { siteName, siteUrl, domain, logoUrl, updatedAt: new Date(), createdAt: new Date() }
	  return await new SiteDomain(newData).save();
	}
};


  