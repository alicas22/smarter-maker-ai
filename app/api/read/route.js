import { NextRequest, NextResponse } from 'next/server'
import { Pinecone } from '@pinecone-database/pinecone'
import {
  queryPineconeVectorStoreAndQueryLLM,
} from '../../../utils'

export async function POST(req) {
  const body = await req.json()
  console.log('body:', body);

  // try {
    const client = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || "",
    });

    console.log('in post requisition for READ');
    const query = body.query;
    console.log('type of query: '+ typeof(query))
    const text = await queryPineconeVectorStoreAndQueryLLM(client, 'rag-ai', query)
    console.log('POST /read - text:', text)

    return NextResponse.json(text)
  // } catch (error) {
  //   return NextResponse.json({ error: error }, { status: 500 })
  // }
}
