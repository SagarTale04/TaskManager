import { log } from "console";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getHealth() {
    const response = await fetch(`${API_URL}/health`);
    console.log(response);
    
    if (!response.ok) {
        throw new Error("Failed to fetch API");
    }

    return response.json();
}