import OpenAI, { NotFoundError } from 'openai';
import { appConfig } from "../../configs/app.config";
import axios, { AxiosResponse } from 'axios';

let url = `https://api.openai.com/v1/chat/completions`

const openai = new OpenAI({
  apiKey: appConfig.llm.openAIKey,
  timeout: appConfig.llm.timeout
});

function generatePrompt(data: any) {
  return `"determine the sentiment without explanation. the result only contain one word that can be is that positive/negative/neutral. here is the article:
  ${data}`;
}


export default async function runOpenAI(data:any) {
    const chatCompletion = await openai.chat.completions.create({
        model: appConfig.llm.openAIModel,
        messages: [{"role": "user", "content": generatePrompt(data)}],
        
    });
    if (chatCompletion.choices[0].message.content) {
      return chatCompletion.choices[0].message.content
    }
}

export async function hitOpenAI(data: string): Promise<any | { error: number }> {
  try {
    const result: AxiosResponse<any> = await axios.request({
      url,
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${appConfig.llm.openAIKey}`
      },
      data: {
        "model": appConfig.llm.openAIModel,
        "messages": [{"role": "user", "content": generatePrompt(data)}],
      }
    });

    return result.data.choices[0].message.content
  } catch (error: any) {
    console.log('Error at hit openAI: ');
    throw error.response 
  }
}