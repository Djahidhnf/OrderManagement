import bwipjs from 'bwip-js';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  try {
    const png = await bwipjs.toBuffer({
      bcid: 'code128',       // barcode type
      text: id,              // data to encode
      scale: 3,
      height: 10,
      includetext: false,
      textxalign: 'center',
    });

    return new Response(new Uint8Array(png), {
      headers: { "Content-Type": "image/png" },
    });

  } catch (err) {
    console.error(err);
    return new Response("Error generating barcode", { status: 500 });
  }
}