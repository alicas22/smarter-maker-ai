import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAI } from "@langchain/openai";
import { loadQAStuffChain } from "langchain/chains";
import { Document } from "langchain/document";

export const updatePinecone = async (client, indexName, docs) => {
  // 1. retrieve pinecone index
  const index = client.Index(indexName);
  // 2. log the retrieved index name
  console.log(`Pinecone index retrieved: ${indexName}`);
  // 3. process each doc in the array
  for (const doc of docs) {
    console.log(`Processing document: ${doc.metadata.source}`);
    const txtPath = doc.metadata.source;
    const text = doc.pageContent;
    //4. create RecursiveCharacterTextSplitter instance
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunksize: 1000,
    });
    console.log("Splitting text into chunks");
    //5. split text into chunks (documents)
    const chunks = await textSplitter.createDocuments([text]);
    console.log(`Text split into ${chunks}`);
    console.log(
      `Calling OpenAI's Embeddding endpoint documents with ${chunks.length} text chunks ...`
    );

    // 6. create OpenAI embeddings for documents
    const embeddingsArrays = await new OpenAIEmbeddings().embedDocuments(
      chunks.map((chunk) => chunk.pageContent.replace(/\n/g, " "))
    );
    console.log(
      `Creating ${chunks.length} vectors array with id, values, and metadata...`
    );
    //7. create and upsert vectors in batches of 100
    const batchSize = 100;
    let batch = [];
    for (let idx = 0; idx < chunks.length; idx++) {
      const chunk = chunks[idx];
      const vector = {
        id: `${txtPath}_${idx}`,
        values: embeddingsArrays[idx],
        metadata: {
          ...chunk.metadata,
          loc: JSON.stringify(chunk.metadata.loc),
          pageContent: chunk.pageContent,
          txtPat: txtPath,
        },
      };
    //   batch = [...batch, vector];
    batch.push(vector);

      // when batch is full or it is the last item, upsert the vectors
      if (batch.length === batchSize || idx === chunks.length - 1) {
        console.log("Upserting the following batch of vectors:", batch);

        await index.upsert(batch);

        //empty the batch
        batch = [];
      }
    }
  }
};

export const queryPineconeVectorStoreAndQueryLLM = async (
  client,
  indexName,
  question
) => {
  // 1. start query process
  console.log("Querying Pinecone vector store...");
  // 2. retrieve Pinecone index
  const index = client.Index(indexName);
  // 3. create query embedding
  const queryEmbedding = await new OpenAIEmbeddings().embedQuery(question);
  // 4. query Pinecone index and return top 10 matches
  let queryResponse = await index.query({
    topK: 10,
    vector: queryEmbedding,
    includeMetadata: true,
    includeValues: true,
  });
  // 5. log the number of matches
  console.log(`Found ${queryResponse.matches.length} matches`);
  // 6. Check if matches exist
  console.log(`Asking question: ${question}...`);
  if (queryResponse.matches.length) {
    //7. create an OpenAI instance and load the QAStuffChain
    const llm = new OpenAI({});
    const chain = loadQAStuffChain(llm);
    // 8. extract and concentrate page content from matched documents
    const concatenatedPageContent = queryResponse.matches
      .map((match) => match.metadata.pageContent) // Fixed typo: metadta -> metadata
      .join(" ");
    const result = await chain.call({
      input_documents: [new Document({ pageContent: concatenatedPageContent })],
      question: question,
    });
    //10. log the answer
    console.log(`Answer: ${result.text}`);
    return result.text;
  } else {
    // 11. if no matches, do not query GPT
    console.log(`No matches, OpenAI will not be queried`);

    // return error;
  }
};

    // console.log('question:', question)
    // const questionForOpenAI = [{ role: 'user', content: question }];
    // console.log('questionForOpenAI:', questionForOpenAI);

    // const res = await fetch('http://localhost:3000/api/chat', {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(questionForOpenAI),
    // });
    // // console.log('json:', await res.json());
    // // console.log('res:', await res.json());
    // return res;
