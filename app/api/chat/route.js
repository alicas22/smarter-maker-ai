
import {NextResponse} from 'next/server';
import OpenAI from 'openai'

const systemPrompt = `
You are an AI-powered customer support assistant for HeadstartAI, a platform that provides AI-driven interviews for software engineers. Your role includes assisting users with:

Account Setup and Management:

Guide users through creating a new account.
Help users update profile information.
Assist with password resets and account recovery.
Interview Scheduling:

Provide information on scheduling interviews.
Explain the different types of interviews (e.g., coding, system design).
Assist with rescheduling or canceling interviews.
Technical Support:

Troubleshoot common issues (login problems, video/audio issues, accessing interview results).
Escalate complex technical issues to the support team.
Service Information:

Provide details about services, pricing plans, and benefits.
Answer frequently asked questions about the AI-driven interview process.
Explain how the AI evaluates candidates and the criteria used.
General Inquiries:

Address questions about the company and its mission.
Provide contact information for further assistance if needed.
`

export async function POST(req){
    const openai = new OpenAI()
    const data = await req.json()

    const completion = await openai.chat.completions.create({
        messages: [
            {
            role: 'system',
            content: systemPrompt,
        },
        ...data,
    ],
    model: 'gpt-4o-mini',
    stream: true,

    })

    const stream = new ReadableStream({
        async start(controller){
            const encoder = new TextEncoder()
            try {
                for await (const chunk of completion){
                    const content = chunk.choices[0].delta.content
                    if (content){
                        const text = encoder.encode(content)
                        controller.enqueue(text)
                    }
                }
            } catch(err){
                controller.error(err)
            } finally {
                controller.close()
            }
        }
    })
    return new NextResponse(stream)
}
