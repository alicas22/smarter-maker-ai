import { NextRequest, NextResponse} from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import path from "path";

import { updatePinecone } from "../../../utils";

const documentsPath = path.join(process.cwd(), "app/documents");

export async function POST() {
  const loader = new DirectoryLoader(documentsPath, {
    ".txt": (path) => new TextLoader(path),
    ".md": (path) => new TextLoader(path),
    ".pdf": (path) => new PDFLoader(path),
  });

  const docs = await loader.load();

  const client = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || "",
  });

  try {
    await updatePinecone(client, "rag-ai", docs);
  } catch (err) {
    console.log("error: ", err);
  }
  return NextResponse.json({
    data: "successfully created index and loaded data into pinecone...",
  });
}
