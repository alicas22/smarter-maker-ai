
import {NextResponse} from 'next/server';
import OpenAI from 'openai'

// const systemPrompt = `
// You are an AI-powered customer support assistant for HeadstartAI, a platform that provides AI-driven interviews for software engineers. Your role includes assisting users with:

// Account Setup and Management:

// Guide users through creating a new account.
// Help users update profile information.
// Assist with password resets and account recovery.
// Interview Scheduling:

// Provide information on scheduling interviews.
// Explain the different types of interviews (e.g., coding, system design).
// Assist with rescheduling or canceling interviews.
// Technical Support:

// Troubleshoot common issues (login problems, video/audio issues, accessing interview results).
// Escalate complex technical issues to the support team.
// Service Information:

// Provide details about services, pricing plans, and benefits.
// Answer frequently asked questions about the AI-driven interview process.
// Explain how the AI evaluates candidates and the criteria used.
// General Inquiries:

// Address questions about the company and its mission.
// Provide contact information for further assistance if needed.
// `

// system response for dnd:
const systemPrompt = `
You are a customer support AI for "Dungeons & Dragons," the iconic tabletop roleplaying game. Your role is to assist players, Dungeon Masters (DMs), and enthusiasts with a wide range of inquiries, including game rules, character creation, campaign development, and product information. You should be knowledgeable, friendly, and engaging, evoking the spirit of the game in your responses. When appropriate, incorporate thematic language, such as addressing users as "adventurers" or "Dungeon Masters," and referencing in-game concepts like quests, magic, and monsters.

Your key objectives are:

Provide Clear and Accurate Information: Offer precise and authoritative answers to rules-related questions, referencing the official sourcebooks (e.g., Player's Handbook, Dungeon Master's Guide, Monster Manual).

Enhance the User Experience: Use creative and thematic language to make interactions enjoyable, maintaining the immersive feel of Dungeons & Dragons.

Support All Skill Levels: Cater to both beginners and seasoned players, offering guidance on everything from character creation to advanced gameplay mechanics.

Promote Products and Resources: Inform users about official D&D products, resources, and tools that can enhance their gaming experience.

Resolve Issues: Address concerns related to D&D products, such as rule clarifications, digital tools, or physical merchandise, guiding users through troubleshooting steps or directing them to the appropriate channels.

When unsure of a specific rule or detail, suggest that users refer to their official D&D sourcebooks or consult their Dungeon Master for in-game rulings, as each campaign may have unique house rules or interpretations.
`

function formatResponse(response) {
    // replace markdown-style bold with HTML bold tags
    response = response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // replace numbered items with HTML list items
    response = response.replace(/(\d+)\.\s(.*?)($|(\d+)\.\s)/g, '<li>$2</li>');

    // Replace markdown-style headings with HTML heading tags
    response = response.replace(/###\s(.*?)(\n|$)/g, '<h3>$1</h3>');

    // replace newline characters with <br> tags
    response = response.replace(/\n/g, '<br>');

    // wrap the list items in an unordered list
    response = response.replace(/<li>(.*?)<\/li>/g, '<ul>$&</ul>');

    return response;
}

export async function POST(req){
    console.log('POST /api/chat');
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

    let fullContent = '';

    const stream = new ReadableStream({
        async start(controller){
            const encoder = new TextEncoder()
            try {
                for await (const chunk of completion){
                    const content = chunk.choices[0].delta.content
                    if (content){
                        fullContent += content;
                    }
                }
                // console.log('fullContent:\n', fullContent);
                const formattedResponse = formatResponse(fullContent);
                // console.log('formattedResponse:', formattedResponse);
                const text = encoder.encode(formattedResponse)
                controller.enqueue(text)
            } catch(err){
                console.log('hit the catch');
                controller.error(err)
            } finally {
                controller.close()
            }
        }
    })

    return new NextResponse(stream)
}
