import { OpenAI } from "langchain/llms/openai";
import { LLMChain } from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";
// import { RetrievalQAChain, loadQARefineChain } from "langchain/chains";
// import { HNSWLib } from "langchain/vectorstores/hnswlib";
// import { OpenAIEmbeddings } from "langchain/embeddings/openai";
// import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { appConfig } from "../../configs/app.config";

const llm = new OpenAI({
  openAIApiKey: appConfig.llm.openAIKey,
  modelName: appConfig.llm.openAIModel
});

const prompt = PromptTemplate.fromTemplate("determine the sentiment without explanation. the result only contain one word that can be is that positive/negative/neutral. here is the article: {product}?");

const chain = new LLMChain({
  llm,
  prompt
});

export const runLLM = async(data: any) => {
	return await chain.run(data);
};





// const VECTOR_STORE_PATH = "Documents.index";

// export const runLLM = async(data: any) => {
//     console.log('Processing...')
//     const model = new OpenAI({ 
//         openAIApiKey: appConfig.llm.openAIKey
//     });
  
//     let vectorStore;

//     console.log('Creating new vector store...')
//     const textSplitter = new RecursiveCharacterTextSplitter({
//       chunkSize: 1000,
//     });
//     const splitDocs = await textSplitter.createDocuments(data);
  
//     // Generate the vector store from the documents
//     vectorStore = await HNSWLib.fromDocuments(
//         splitDocs,
//         new OpenAIEmbeddings()
//     );

//     await vectorStore.save(VECTOR_STORE_PATH);
//     console.log("Vector store created.")

//     console.log("Creating retrieval chain...")
//     // Query the retrieval chain with the specified question
//     // const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever())

//     const chain = new RetrievalQAChain({
//         combineDocumentsChain: loadQARefineChain(model),
//         retriever: vectorStore.asRetriever(),
//     });

//     console.log("Querying chain...")
//     const res = await chain.call({ query: data })
//     console.log(res)
// 	// return await chain.call({query: `determine the sentiment without explanation. the result only contain one word that can be is that positive/negative/neutral. here is the article: ${data}`});
// };

