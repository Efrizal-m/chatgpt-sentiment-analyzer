import axios, { AxiosResponse } from 'axios';

interface TwitterData {
  keyword: string,
  influencer:object
}

interface InstagramData {
  hashtag: string,
  influencer:object
}

export async function hitTwitter(url: string): Promise<any | { error: number }> {
  try {
    const result: AxiosResponse<any> = await axios.request({
      url,
      method: 'GET',
    });

    return result.data;
  } catch (error: any) {
    console.log('Error at hit twitter: ');
    console.log(error);

    // If there's an error, return an object indicating the error status.
    return { status: error.response?.status || -1 };
  }
}

export async function hitInstagram(url: string): Promise<any | { error: number }> {
  try {
    const result: AxiosResponse<any> = await axios.request({
      url,
      method: 'GET',
    });

    return result.data;
  } catch (error: any) {
    console.log('Error at hit instagram: ');
    console.log(error);

    // If there's an error, return an object indicating the error status.
    return { status: error.response?.status || -1 };
  }
}