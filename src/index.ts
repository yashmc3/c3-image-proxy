/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  SANITY_ASSETS: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  //
  // Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
  // MY_SERVICE: Fetcher;
}

async function getAssetUrl(ogFileName: string) {
  // grab the file name from url\

  const query = `*[originalFilename=="${ogFileName}"]`;
  const res = await fetch(
    `https://tkk9p83q.api.sanity.io/v2021-10-21/data/query/production?query=${query}`
  );
  const json: any = await res.json();
  return json?.result[0]?.url;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { pathname, search = "" } = new URL(request.url);
    const ogFileName = pathname.replace("/", "");

    if (!ogFileName) {
      return new Response("File Name not present in url", {
        status: 400,
      });
    }

    let imgURL = await env.SANITY_ASSETS.get(ogFileName);
    console.log("************************************");
    console.log("Cached url : ", imgURL);
    console.log("************************************");

    if (!imgURL) {
      imgURL = await getAssetUrl(ogFileName);
      console.log("sanity url :", imgURL);
      if (!imgURL) {
        return new Response("File not found.", {
          status: 404,
        });
      }
      imgURL && (await env.SANITY_ASSETS.put(ogFileName, imgURL));
      console.log("Uploaded as cache");
    }
    return fetch(imgURL + search);
  },
};
