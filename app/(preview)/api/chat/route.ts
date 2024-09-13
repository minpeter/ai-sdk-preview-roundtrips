import { getOrders, getTrackingInformation, ORDERS } from "@/components/data";
import { friendli } from "@friendliai/ai-provider";
import { convertToCoreMessages, streamText } from "ai";
import { z } from "zod";

export async function POST(request: Request) {
  const { messages } = await request.json();

  const stream = await streamText({
    model: friendli("meta-llama-3.1-70b-instruct"),
    system: `\
      - you are a friendly package tracking assistant
      - your responses are concise
      - you do not ever use lists, tables, or bullet points; instead, you provide a single response
    `,
    messages: convertToCoreMessages(messages),
    maxToolRoundtrips: 6,
    tools: {
      listOrders: {
        description: "View the entire order delivery history and orderId list",
        parameters: z.object({}),
        execute: async function ({}) {
          const orders = getOrders();
          return orders;
        },
      },
      viewTrackingInformation: {
        description: "view tracking information for a specific order",
        parameters: z.object({
          orderId: z
            .number()
            .describe("Enter the unique number of the order you want to track"),
        }),
        execute: async function ({ orderId }) {
          const trackingInformation = getTrackingInformation({
            orderId: orderId.toString(),
          });
          await new Promise((resolve) => setTimeout(resolve, 500));
          return (
            trackingInformation || "Please try again with the correct orderId"
          );
        },
      },
    },
  });

  return stream.toDataStreamResponse();
}
