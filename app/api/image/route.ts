import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import Configuration from "openai";
import OpenAIApi from "openai";
import { incrementApiLimit,checkApiLimit } from "@/lib/api-limit";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi();

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const body = await req.json();
    const { prompt , amount="1" , resolution="512x512" } = body;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!configuration.apiKey) {
      return new NextResponse("OpenAI API Key not configured.", { status: 500 });
    }

    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 });
    }

    if (!amount) {
      return new NextResponse("Amount is required", { status: 400 });
    }

    if (!resolution) {
      return new NextResponse("Resolution is required", { status: 400 });
    }
    const freeTrial = await checkApiLimit();
    // const isPro = await checkSubscription();

    if (!freeTrial ) {
      return new NextResponse("Free trial has expired. Please upgrade to pro.", { status: 403 });
    }
    const response = await openai.images.generate({
      prompt,
      n:parseInt(amount,10),
      size:resolution,
    });
    console.log(response );
    return NextResponse.json(response.data);
  } catch (error) {
    console.log("Image error", error);
    return new NextResponse("Internal Error", { status: 500});
  }
}