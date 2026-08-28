import { getHealth } from "../services/app";

export default async function Home() {
    const data = await getHealth();

    return (
        <>
        <main className="p-10">
            <h1 className="text-3xl font-bold">
                SyncSprint
            </h1>

            <p className="mt-4">
                {data.message}<br></br>{data.databaseTime}
            </p>
        </main>
        </>
    );
}