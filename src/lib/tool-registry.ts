// The tool registry is the structured-data backbone described in the SEO spec.
// Every field here is hand-authored per tool — nothing is templated verbatim
// from the tool name. This keeps programmatic scaling honest: adding tool #51
// still requires someone to actually think about its content and intent.

export type Category = {
  slug: string;
  name: string;
  description: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type WorkedExample = {
  label: string;
  input: string;
  result: string;
  explanation: string;
};

export type ToolConfig = {
  slug: string;
  name: string;
  category: string; // Category["slug"]

  // SEO metadata
  title: string;
  metaDescription: string;
  h1: string;
  intro: string;

  primaryIntent: string;
  secondaryIntents?: string[];

  // Content
  formula?: { label: string; expression: string }[];
  examples?: WorkedExample[];
  faq?: FaqItem[];
  edgeCaseNotes?: string[];

  // Relationships
  relatedTools: string[]; // ToolConfig["slug"]

  // Technical
  schemaType: "WebApplication" | "SoftwareApplication";
  indexable: boolean;
  lastUpdated: string; // ISO date
};

export const categories: Category[] = [
  {
    slug: "calculators",
    name: "Calculators",
    description:
      "Calculators for percentages, dates, money, and everyday math — no sign-up, instant results.",
  },
  {
    slug: "image-tools",
    name: "Image Tools",
    description:
      "Compress, resize, and convert images entirely in your browser — nothing is ever uploaded.",
  },
  {
    slug: "developer-tools",
    name: "Developer Tools",
    description:
      "JSON, encoding, and other developer utilities that run entirely in your browser.",
  },
  {
    slug: "pdf-tools",
    name: "PDF Tools",
    description:
      "Merge, split, and manage PDF files entirely in your browser — nothing is ever uploaded.",
  },
  {
    slug: "text-tools",
    name: "Text Tools",
    description:
      "Count words and characters and work with text entirely in your browser — nothing is ever uploaded.",
  },
  {
    slug: "social-media-tools",
    name: "Social Media Tools",
    description:
      "Generate captions, hashtags, titles, and bios using simple templates — entirely in your browser.",
  },
];

export const tools: ToolConfig[] = [
  {
    slug: "percentage-calculator",
    name: "Percentage Calculator",
    category: "calculators",

    title: "Percentage Calculator — Percent & Increase",
    metaDescription:
      "Calculate percentages instantly: find what X% of Y is, work out percentage increase or decrease, or compare two numbers. Free, accurate, no sign-up.",
    h1: "Percentage Calculator",
    intro:
      "Work out what a percentage of a number is, how much a value increased or decreased, or what percentage one number is of another. Pick a mode below and get an instant, exact result.",

    primaryIntent: "percentage calculator",
    secondaryIntents: [
      "calculate percentage",
      "percentage formula",
      "what is x percent of y",
      "percentage increase calculator",
      "percentage decrease calculator",
      "percentage difference calculator",
    ],

    formula: [
      { label: "X% of Y", expression: "(X ÷ 100) × Y" },
      { label: "Percentage increase", expression: "((New − Old) ÷ Old) × 100" },
      { label: "Percentage decrease", expression: "((Old − New) ÷ Old) × 100" },
      { label: "X is what % of Y", expression: "(X ÷ Y) × 100" },
      {
        label: "Percentage difference",
        expression: "(|A − B| ÷ ((A + B) ÷ 2)) × 100",
      },
    ],

    examples: [
      {
        label: "Finding a percentage of a number",
        input: "20% of 150",
        result: "30",
        explanation: "(20 ÷ 100) × 150 = 30",
      },
      {
        label: "Percentage increase",
        input: "Price goes from 80 to 100",
        result: "25% increase",
        explanation: "((100 − 80) ÷ 80) × 100 = 25%",
      },
      {
        label: "Percentage decrease",
        input: "Price goes from 100 to 80",
        result: "20% decrease",
        explanation: "((100 − 80) ÷ 100) × 100 = 20%",
      },
      {
        label: "What percent is X of Y",
        input: "45 out of 60",
        result: "75%",
        explanation: "(45 ÷ 60) × 100 = 75%",
      },
    ],

    faq: [
      {
        question: "Why is percentage increase different from percentage decrease going back?",
        answer:
          "Percentage change is calculated against the starting value each time, and the starting value is different in each direction. Going from 80 to 100 is a 25% increase, but going back from 100 to 80 is only a 20% decrease, because 20 is a smaller share of 100 than it is of 80.",
      },
      {
        question: "What's the difference between percentage change and percentage difference?",
        answer:
          "Percentage change (increase or decrease) assumes one value is the original and the other is the new value, so the order matters. Percentage difference treats both values equally by comparing against their average, which is useful when neither number is clearly the \"before\" value.",
      },
      {
        question: "Can a percentage be negative?",
        answer:
          "Yes. A negative result in percentage increase/decrease mode means the value went down. A negative percentage in \"X is what % of Y\" mode means X was negative relative to a positive Y, or vice versa.",
      },
    ],

    edgeCaseNotes: [
      "If the original value in a percentage increase/decrease calculation is 0, the percentage change is undefined (you cannot divide by zero) — the calculator flags this rather than showing a misleading number.",
      "Very large numbers are handled at full precision; results are rounded for display but not for the underlying calculation.",
      "Negative inputs are allowed where mathematically meaningful (for example, a value decreasing past zero into negative territory).",
    ],

    relatedTools: [],

    schemaType: "WebApplication",
    indexable: true,
    lastUpdated: "2026-09-13",
  },

  // --- Image Compressor family -------------------------------------------
  // One shared tool (ImageCompressor.tsx / the image-compressor worker)
  // rendered behind several registry entries, each targeting a distinct,
  // genuinely different search intent (see build brief §21-22). The preset
  // pages initialize the same tool with a pre-filled target size or output
  // format — they are not duplicate content with a different number in the
  // URL; each has its own title/description/FAQ reflecting that intent.

  {
    slug: "image-compressor",
    name: "Image Compressor",
    category: "image-tools",

    title: "Free Online Image Compressor — JPG, PNG, WebP",
    metaDescription:
      "Compress JPG, PNG, and WebP images free online. Hit an exact KB target or use balanced quality — processed in your browser, nothing is uploaded.",
    h1: "Free Online Image Compressor",
    intro:
      "Shrink JPG, PNG, or WebP images down to the size you need. Drop in a file, optionally set a target size in KB, and download the compressed result — all processed on your device.",

    primaryIntent: "image compressor",
    secondaryIntents: [
      "compress image online",
      "reduce image size",
      "compress jpg",
      "compress png",
      "compress webp",
      "compress image to 50kb",
      "compress image to 100kb",
      "compress image to 200kb",
    ],

    faq: [
      {
        question: "Are my images uploaded to a server?",
        answer:
          "No. Everything happens locally in your browser using the Canvas API running in a background worker. Your images are never sent over the network.",
      },
      {
        question: "Can I compress a PNG to an exact file size like a JPEG?",
        answer:
          "Yes, but the mechanism is different. PNG compression is lossless — the tool reduces file size through optimization rather than a JPEG-style quality slider, and will fall back to shrinking dimensions if needed. For the smallest possible file size, converting to WebP usually produces better results than an optimized PNG.",
      },
      {
        question: "What happens if my target size can't be reached?",
        answer:
          "The tool returns the smallest practical result it could produce and tells you it couldn't fully reach your target, rather than silently returning a file that's larger than what you asked for.",
      },
      {
        question: "Is there a limit on file size or number of images?",
        answer:
          "Each image can be up to 50 MB, and you can compress up to 20 images at once in a batch.",
      },
    ],

    edgeCaseNotes: [
      "Images are automatically downscaled before processing if they exceed 4096px on their longest side, to keep compression fast and memory-safe on all devices.",
      "EXIF orientation is read and applied so photos from phones stay upright — and because the output is re-encoded from pixels, no EXIF metadata (including location data) carries over to the compressed file.",
      "If a requested target size is already larger than the original file, the tool won't unnecessarily degrade the image just to hit a number.",
    ],

    relatedTools: ["compress-jpeg", "compress-png"],

    schemaType: "WebApplication",
    indexable: true,
    lastUpdated: "2026-09-13",
  },

  {
    slug: "compress-image-to-50kb",
    name: "Compress Image to 50KB",
    category: "image-tools",

    title: "Compress Image to 50KB Online — Free",
    metaDescription:
      "Compress a JPG, PNG, or WebP image to 50KB or less, free and online. Processed entirely in your browser — your image is never uploaded.",
    h1: "Compress an Image to 50KB",
    intro:
      "Many forms, portals, and application systems cap uploads at 50KB. Drop your image in below — the target size is already set to 50KB.",

    primaryIntent: "compress image to 50kb",
    secondaryIntents: ["reduce image to 50kb", "image compressor 50kb"],

    faq: [
      {
        question: "Will my image definitely end up at exactly 50KB?",
        answer:
          "The tool aims for at or just under 50KB, not exactly 50KB — an exact byte count isn't meaningful for compressed image formats. If 50KB genuinely can't be reached without excessive quality loss, you'll get the closest practical result instead.",
      },
      {
        question: "Which format compresses smallest at 50KB?",
        answer:
          "WebP typically reaches a given target size at noticeably better visual quality than JPEG or PNG, so it's worth trying if quality at 50KB matters to you.",
      },
    ],

    relatedTools: ["image-compressor", "compress-image-to-100kb", "compress-image-to-200kb"],

    schemaType: "WebApplication",
    indexable: true,
    lastUpdated: "2026-09-13",
  },

  {
    slug: "compress-image-to-100kb",
    name: "Compress Image to 100KB",
    category: "image-tools",

    title: "Compress Image to 100KB Online — Free",
    metaDescription:
      "Compress a JPG, PNG, or WebP image to 100KB or less, free and online. Processed entirely in your browser — your image is never uploaded.",
    h1: "Compress an Image to 100KB",
    intro:
      "A common upload limit for resumes, listings, and web forms. Drop your image in below — the target size is already set to 100KB.",

    primaryIntent: "compress image to 100kb",
    secondaryIntents: ["reduce image to 100kb", "image compressor 100kb"],

    faq: [
      {
        question: "Will my image definitely end up at exactly 100KB?",
        answer:
          "The tool aims for at or just under 100KB, not an exact byte count — that isn't meaningful for compressed image formats. If 100KB can't be reached without excessive quality loss, you'll get the closest practical result instead.",
      },
    ],

    relatedTools: ["image-compressor", "compress-image-to-50kb", "compress-image-to-200kb"],

    schemaType: "WebApplication",
    indexable: true,
    lastUpdated: "2026-09-13",
  },

  {
    slug: "compress-image-to-200kb",
    name: "Compress Image to 200KB",
    category: "image-tools",

    title: "Compress Image to 200KB Online — Free",
    metaDescription:
      "Compress a JPG, PNG, or WebP image to 200KB or less, free and online. Processed entirely in your browser — your image is never uploaded.",
    h1: "Compress an Image to 200KB",
    intro:
      "A common ceiling for email attachments and CMS uploads. Drop your image in below — the target size is already set to 200KB.",

    primaryIntent: "compress image to 200kb",
    secondaryIntents: ["reduce image to 200kb", "image compressor 200kb"],

    faq: [
      {
        question: "Will my image definitely end up at exactly 200KB?",
        answer:
          "The tool aims for at or just under 200KB, not an exact byte count. If 200KB can't be reached without excessive quality loss, you'll get the closest practical result instead.",
      },
    ],

    relatedTools: ["image-compressor", "compress-image-to-50kb", "compress-image-to-100kb"],

    schemaType: "WebApplication",
    indexable: true,
    lastUpdated: "2026-09-13",
  },

  {
    slug: "compress-jpeg",
    name: "Compress JPEG",
    category: "image-tools",

    title: "Compress JPEG Online — Free JPG Compressor",
    metaDescription:
      "Compress a JPEG or JPG image online for free. Reduce file size with adjustable quality or an exact KB target, all processed in your browser.",
    h1: "Compress a JPEG Image",
    intro:
      "Reduce a JPG or JPEG photo's file size while keeping it looking good. Output format is already set to JPG.",

    primaryIntent: "compress jpeg",
    secondaryIntents: ["compress jpg", "jpeg compressor", "reduce jpg file size"],

    faq: [
      {
        question: "Does compressing a JPEG lose quality?",
        answer:
          "JPEG compression is lossy by nature, so yes, some detail is traded for a smaller file. The tool searches for the highest quality that still meets your target size (if you set one), so the loss is kept as small as the target allows.",
      },
    ],

    relatedTools: ["image-compressor", "compress-png"],

    schemaType: "WebApplication",
    indexable: true,
    lastUpdated: "2026-09-13",
  },

  {
    slug: "compress-png",
    name: "Compress PNG",
    category: "image-tools",

    title: "Compress PNG Online — Free PNG Compressor",
    metaDescription:
      "Compress a PNG image online for free. Losslessly optimize file size, all processed in your browser — nothing is ever uploaded.",
    h1: "Compress a PNG Image",
    intro:
      "Reduce a PNG's file size through lossless optimization. Output format is already set to PNG.",

    primaryIntent: "compress png",
    secondaryIntents: ["png compressor", "reduce png file size", "optimize png"],

    faq: [
      {
        question: "Why doesn't PNG have a quality slider like JPEG?",
        answer:
          "PNG is a lossless format, so there's no visual-quality tradeoff to dial in the way there is with JPEG. This tool instead optimizes the PNG's internal encoding, and falls back to reducing dimensions if you've set a target size that optimization alone can't reach.",
      },
      {
        question: "How can I get a PNG much smaller than optimization alone allows?",
        answer:
          "Convert it to WebP instead — WebP supports genuine lossy compression and typically produces a substantially smaller file than even a well-optimized PNG.",
      },
    ],

    relatedTools: ["image-compressor", "compress-jpeg"],

    schemaType: "WebApplication",
    indexable: true,
    lastUpdated: "2026-09-13",
  },

  // --- Image Resizer -------------------------------------------------
  // A separate tool from the Compressor family above (different job:
  // exact dimensions vs. smaller file size), but reuses the same worker
  // pattern, safety clamp, and PNG encoder. See
  // src/workers/image-resizer.worker.ts for the reuse details.

  {
    slug: "image-resizer",
    name: "Image Resizer",
    category: "image-tools",

    title: "Free Online Image Resizer — JPG, PNG, WebP",
    metaDescription:
      "Resize a JPG, PNG, or WebP image to an exact width and height, free online. Lock the aspect ratio or set both manually — processed in your browser.",
    h1: "Free Online Image Resizer",
    intro:
      "Resize a JPG, PNG, or WebP image to the exact dimensions you need. Lock the aspect ratio to resize proportionally, or set width and height independently.",

    primaryIntent: "image resizer",
    secondaryIntents: [
      "resize image online",
      "resize jpg",
      "resize png",
      "resize webp",
      "change image dimensions",
    ],

    faq: [
      {
        question: "Will resizing distort my image?",
        answer:
          "Only if you unlock the aspect ratio and choose a width and height that don't match the original proportions. Keep the aspect ratio locked to resize proportionally without stretching.",
      },
      {
        question: "Can I make an image larger than the original?",
        answer:
          "Yes — you can enter dimensions larger than the original, though enlarging a photo significantly can make it look softer since no new detail is created.",
      },
      {
        question: "Is my image uploaded anywhere?",
        answer:
          "No. Resizing happens entirely in your browser using a background worker. Your image is never sent over the network.",
      },
    ],

    edgeCaseNotes: [
      "Very large source images are automatically downscaled before processing if they exceed 4096px on their longest side, matching the safety limit used by the Image Compressor.",
      "EXIF orientation is applied so photos from phones resize the right way up, and the output is re-encoded from pixels so no EXIF metadata carries over.",
    ],

    relatedTools: ["image-compressor"],

    schemaType: "WebApplication",
    indexable: true,
    lastUpdated: "2026-09-13",
  },

  // --- JSON Formatter & Validator -------------------------------------
  // First tool in the "developer-tools" category. No shared infrastructure
  // with the image tools — pure native JSON.parse/stringify, no worker
  // (near-instant at any sane input size, so a worker would add complexity
  // without benefit), no new dependency.

  {
    slug: "json-formatter",
    name: "JSON Formatter & Validator",
    category: "developer-tools",

    title: "Free JSON Formatter & Validator Online",
    metaDescription:
      "Format, minify, and validate JSON online for free. Clear, specific error messages instead of a generic failure — all processed in your browser.",
    h1: "JSON Formatter & Validator",
    intro:
      "Paste or type JSON, then format it for readability, minify it for size, or just validate it. Invalid JSON gets a clear, specific error instead of a generic failure.",

    primaryIntent: "json formatter",
    secondaryIntents: [
      "json validator",
      "json minifier",
      "format json online",
      "validate json online",
      "json beautifier",
      "pretty print json",
    ],

    faq: [
      {
        question: "Is my JSON uploaded anywhere?",
        answer:
          "No. Formatting, minifying, and validating all happen locally in your browser using JavaScript's built-in JSON parser. Nothing is sent over the network.",
      },
      {
        question: "What happens if my JSON is invalid?",
        answer:
          "You'll get a specific error describing what's wrong, including the line and column when your browser's JSON parser can determine one — not just a generic \"invalid JSON\" message.",
      },
      {
        question: "Is there a size limit?",
        answer:
          "Yes, a generous one — input up to about 5 million characters is supported, which comfortably covers any JSON a person would realistically paste into a browser tool.",
      },
    ],

    edgeCaseNotes: [
      "Line and column numbers in error messages are only shown when the browser's JSON parser provides enough information to derive them accurately — Nimlyx Do never guesses or fabricates a location.",
      "Formatting uses 2-space indentation via JavaScript's native JSON.stringify; minifying removes all insignificant whitespace.",
    ],

    relatedTools: [],

    schemaType: "WebApplication",
    indexable: true,
    lastUpdated: "2026-09-13",
  },

  // --- PDF Merger --------------------------------------------------
  // First tool in the "pdf-tools" category. Uses pdf-lib (structural PDF
  // manipulation, not rasterization) so merged pages are the originals,
  // copied byte-for-byte in structure — not re-rendered images.

  {
    slug: "pdf-merger",
    name: "PDF Merger",
    category: "pdf-tools",

    title: "Free Online PDF Merger — Combine PDFs",
    metaDescription:
      "Merge multiple PDF files into one, free and online. Reorder pages before merging — processed entirely in your browser, nothing is ever uploaded.",
    h1: "Free Online PDF Merger",
    intro:
      "Combine multiple PDF files into one document. Add your PDFs, reorder them however you like, and merge — all processed on your device.",

    primaryIntent: "pdf merger",
    secondaryIntents: [
      "merge pdf online",
      "combine pdf files",
      "join pdf files",
      "merge pdf free",
    ],

    faq: [
      {
        question: "Are my PDFs uploaded to a server?",
        answer:
          "No. Merging happens entirely in your browser using a background worker. Your files are never sent over the network.",
      },
      {
        question: "Does merging affect the quality of my PDFs?",
        answer:
          "No — pages are copied directly from the original files, not rendered to images and reassembled, so text stays selectable and quality is unchanged.",
      },
      {
        question: "Can I merge password-protected PDFs?",
        answer:
          "Not currently. If a PDF is encrypted or otherwise can't be read, you'll see a clear error for that specific file so you can remove or replace it without losing the rest of your batch.",
      },
      {
        question: "Is there a limit on file size or number of PDFs?",
        answer: "Each PDF can be up to 100 MB, and you can merge up to 30 files at once.",
      },
    ],

    edgeCaseNotes: [
      "Files are validated by their actual content (checking for a real PDF header), not just their file extension or browser-reported type.",
      "A corrupt or unsupported file is reported individually and can be removed — it doesn't block merging the rest of the batch.",
      "The merged file always downloads as \"merged.pdf\" rather than using a name derived from any of the source files.",
    ],

    relatedTools: ["pdf-splitter", "pdf-compressor", "jpg-to-pdf", "pdf-to-jpg"],

    schemaType: "WebApplication",
    indexable: true,
    lastUpdated: "2026-09-13",
  },

  // --- PDF Compressor --------------------------------------------------
  // Second tool in "pdf-tools". IMPORTANT ARCHITECTURE NOTE: this runs
  // 100% client-side, not server-side — see the decision log in
  // PROJECT_CONTEXT.md and the header comment in
  // src/lib/pdf-compressor/compress.ts for the full reasoning. It does
  // genuine JPEG recompression for DCTDecode-encoded images (the usual
  // source of most of a PDF's size) plus object-graph optimization on
  // save; other image encodings are left untouched rather than risk
  // corrupting them, so not every PDF will shrink — that's communicated
  // honestly in the UI, not hidden.

  {
    slug: "pdf-compressor",
    name: "PDF Compressor",
    category: "pdf-tools",

    title: "Free Online PDF Compressor — Reduce PDF Size",
    metaDescription:
      "Compress a PDF online for free. Choose your compression level and reduce file size — processed entirely in your browser, nothing is ever uploaded.",
    h1: "Compress PDF",
    intro: "Reduce PDF file size without unnecessary quality loss. Everything happens on your device.",

    primaryIntent: "pdf compressor",
    secondaryIntents: [
      "compress pdf online",
      "reduce pdf size",
      "reduce pdf file size",
      "make pdf smaller",
      "compress pdf free",
    ],

    faq: [
      {
        question: "Is my PDF uploaded to a server?",
        answer:
          "No. Compression happens entirely in your browser using a background worker. Your file is never sent over the network.",
      },
      {
        question: "Will every PDF get smaller?",
        answer:
          "Not always. Some PDFs are already well optimized, or use image formats this tool doesn't recompress. When compressing wouldn't actually help, you'll see that clearly and can still download your original file — we never present a larger file as a successful compression.",
      },
      {
        question: "What's the difference between the compression levels?",
        answer:
          "Extreme prioritizes the smallest possible file size with more visible quality loss in images. Recommended balances size and quality. Low keeps images closer to their original quality while still trimming unnecessary size.",
      },
      {
        question: "Does compression affect text or just images?",
        answer:
          "The size reduction mainly comes from recompressing embedded images — text, fonts, and page structure are preserved as-is.",
      },
    ],

    edgeCaseNotes: [
      "Only images stored as standard JPEG data inside the PDF are recompressed; other image encodings are left untouched to avoid any risk of corrupting the file.",
      "If the compressed result wouldn't actually be smaller than the original, the original file is kept and offered for download instead.",
    ],

    relatedTools: ["pdf-merger"],

    schemaType: "WebApplication",
    indexable: true,
    lastUpdated: "2026-09-13",
  },

  // --- PDF to JPG --------------------------------------------------
  // Third tool in "pdf-tools". IMPORTANT ARCHITECTURE NOTE: this is the
  // first tool in the project that actually rasterizes a PDF page to
  // pixels, and so the first to add pdfjs-dist as a dependency — pdf-lib
  // (used by PDF Merger/Compressor) has no renderer at all. Rendering
  // happens via pdfjs-dist + OffscreenCanvas entirely inside a worker;
  // see the decision log in PROJECT_CONTEXT.md and the header comment in
  // src/lib/pdf-to-jpg/render.ts for the full reasoning.

  {
    slug: "pdf-to-jpg",
    name: "PDF to JPG",
    category: "pdf-tools",

    title: "Free PDF to JPG Converter Online",
    metaDescription:
      "Convert PDF pages to JPG images online, free. Preview and download instantly — processed entirely in your browser, nothing is ever uploaded.",
    h1: "Convert PDF to JPG",
    intro: "Convert PDF pages into JPG images directly in your browser. Everything happens on your device.",

    primaryIntent: "pdf to jpg",
    secondaryIntents: [
      "convert pdf to jpg",
      "pdf pages to images",
      "convert pdf pages to jpg",
      "pdf to image",
    ],

    faq: [
      {
        question: "Is my PDF uploaded to a server?",
        answer:
          "No. Conversion happens entirely in your browser using a background worker. Your file is never sent over the network.",
      },
      {
        question: "What happens with multi-page PDFs?",
        answer:
          "Each page becomes its own JPG image, named after your file (for example \"document-page-1.jpg\"). You can download pages individually or all at once as a ZIP.",
      },
      {
        question: "What do the quality and resolution options change?",
        answer:
          "Quality controls JPG compression — higher quality means larger files with less compression artifacting. Resolution controls how large and sharp each page image is; higher resolution is better for printing or zooming but produces bigger files and uses more memory to generate.",
      },
      {
        question: "Can I convert only some pages?",
        answer:
          "Yes — choose specific pages or ranges (for example \"1-3, 5, 8\") instead of converting the whole document.",
      },
      {
        question: "Can I convert password-protected or scanned PDFs?",
        answer:
          "Password-protected PDFs currently aren't supported and will show a clear error. Scanned PDFs work like any other PDF — each scanned page is rendered and converted like a normal page.",
      },
    ],

    edgeCaseNotes: [
      "Files are validated by their actual content (checking for a real PDF header), not just their file extension or browser-reported type.",
      "Pages are rendered to a canvas and encoded as JPEG (which has no transparency), so any transparent regions in a page are filled white in the output.",
      "Very large or very high-resolution multi-page documents are converted one page at a time and streamed to previews as they finish, to avoid holding every page in memory at once — extremely large documents may still hit a practical browser memory limit, which is reported clearly rather than freezing the page.",
    ],

    relatedTools: ["pdf-merger", "pdf-compressor"],

    schemaType: "WebApplication",
    indexable: true,
    lastUpdated: "2026-09-14",
  },

  // --- PDF Splitter --------------------------------------------------
  // Fourth tool in "pdf-tools" — the inverse of PDF Merger, reusing the
  // same pdf-lib structural page-copy approach (no rasterization, so no
  // pdfjs-dist dependency and lower technical risk than PDF to JPG).

  {
    slug: "pdf-splitter",
    name: "PDF Splitter",
    category: "pdf-tools",

    title: "Free PDF Splitter — Split PDF Files",
    metaDescription:
      "Split a PDF into individual pages or custom ranges online, free. Processed entirely in your browser — nothing is ever uploaded.",
    h1: "Split a PDF",
    intro: "Split a PDF into separate files by page or custom ranges, directly in your browser.",

    primaryIntent: "split pdf",
    secondaryIntents: [
      "pdf splitter",
      "split pdf into pages",
      "extract pages from pdf",
      "split pdf by page range",
    ],

    faq: [
      {
        question: "Is my PDF uploaded to a server?",
        answer:
          "No. Splitting happens entirely in your browser using a background worker. Your file is never sent over the network.",
      },
      {
        question: "What's the difference between the two split modes?",
        answer:
          "\"Individual pages\" creates one PDF per page of your document. \"Custom ranges\" lets you group pages yourself — for example \"1-3, 4-6, 10\" creates three files: pages 1 through 3, pages 4 through 6, and page 10 on its own.",
      },
      {
        question: "Does splitting reduce quality?",
        answer:
          "No. Pages are copied structurally, not re-rendered as images, so text stays selectable and fonts, links, and image quality are preserved exactly as in the original.",
      },
      {
        question: "Can I split a password-protected PDF?",
        answer: "Password-protected PDFs currently aren't supported and will show a clear error.",
      },
    ],

    edgeCaseNotes: [
      "Files are validated by their actual content (a real PDF header check), not just their file extension or browser-reported type.",
      "A one-page PDF has nothing to split and is reported as such rather than silently producing a single, identical output file.",
      "Custom ranges are validated against the document's real page count before splitting begins — an out-of-range page or a badly formed range is reported clearly rather than attempted.",
    ],

    relatedTools: ["pdf-merger", "pdf-compressor", "pdf-to-jpg"],

    schemaType: "WebApplication",
    indexable: true,
    lastUpdated: "2026-09-15",
  },

  // --- JPG to PDF ------------------------------------------------
  // Fifth tool in "pdf-tools" — the inverse of PDF to JPG, closing the
  // PDF cluster loop (compress/merge/split/convert both directions). No
  // new dependency: uses pdf-lib's embedJpg/embedPng only, the same
  // dependency PDF Merger and PDF Splitter already use.

  {
    slug: "jpg-to-pdf",
    name: "JPG to PDF",
    category: "pdf-tools",

    title: "Free JPG to PDF Converter Online",
    metaDescription:
      "Convert JPG or PNG images to PDF online, free. Combine multiple images into one PDF — processed entirely in your browser, nothing is ever uploaded.",
    h1: "Convert JPG to PDF",
    intro: "Turn one or more JPG or PNG images into a single PDF, directly in your browser.",

    primaryIntent: "jpg to pdf",
    secondaryIntents: [
      "image to pdf",
      "convert jpg to pdf",
      "png to pdf",
      "photo to pdf",
      "combine images into pdf",
    ],

    faq: [
      {
        question: "Is my image uploaded to a server?",
        answer:
          "No. Conversion happens entirely in your browser using a background worker. Your images are never sent over the network.",
      },
      {
        question: "Can I convert multiple images into one PDF?",
        answer:
          "Yes — add as many JPG or PNG images as you like, reorder them, and they'll be combined into a single PDF with one image per page, in the order you set.",
      },
      {
        question: "What do the page size options mean?",
        answer:
          "\"Fit to image\" makes each page exactly match that image's own size, with no scaling or margin. \"A4\" and \"Letter\" use standard page sizes, scaling each image down to fit within a margin while preserving its aspect ratio, and matching page orientation to the image.",
      },
      {
        question: "Does converting reduce image quality?",
        answer:
          "No. Images are embedded into the PDF using their original encoded data, not re-rendered or re-compressed, so quality is preserved exactly (aside from any scaling needed to fit a standard page size).",
      },
    ],

    edgeCaseNotes: [
      "Files are validated by their actual content (real JPEG/PNG signature checks), not just file extension or browser-reported type.",
      "With \"A4\" or \"Letter\" page size, images are never scaled up past their original size — only down, to avoid visibly blurring a small image stretched to fill a page.",
      "Page orientation for A4/Letter follows each image individually (a landscape photo gets a landscape page), so a mixed batch of portrait and landscape images produces mixed page orientations in the output PDF.",
    ],

    relatedTools: ["pdf-to-jpg", "pdf-merger", "pdf-splitter"],

    schemaType: "WebApplication",
    indexable: true,
    lastUpdated: "2026-09-15",
  },

  // --- Word Counter --------------------------------------------------
  // First tool in a new "text-tools" category (see decision log for why
  // a new category was added rather than folding this into
  // "developer-tools"). No worker, no new dependency — pure synchronous
  // string logic, computed live on every keystroke.

  {
    slug: "word-counter",
    name: "Word Counter",
    category: "text-tools",

    title: "Free Word Counter & Reading Time Tool",
    metaDescription:
      "Count words, characters, sentences, and paragraphs instantly, free. See estimated reading and speaking time — processed entirely in your browser.",
    h1: "Word Counter",
    intro: "Count words, characters, sentences, and paragraphs — with live reading and speaking time estimates.",

    primaryIntent: "word counter",
    secondaryIntents: [
      "character counter",
      "word count",
      "count words online",
      "sentence counter",
      "reading time calculator",
    ],

    faq: [
      {
        question: "Is my text uploaded anywhere?",
        answer: "No. Everything is counted locally in your browser as you type — your text is never sent over the network.",
      },
      {
        question: "How is reading time calculated?",
        answer:
          "Reading time assumes an average silent reading speed of about 200 words per minute. Speaking time assumes an average presentation pace of about 130 words per minute. Both are estimates, not exact measurements.",
      },
      {
        question: "How are sentences counted?",
        answer:
          "Sentences are counted by splitting on periods, exclamation points, and question marks, while recognizing common abbreviations (\"Mr.\", \"Dr.\", \"Inc.\", \"U.S.\", \"e.g.\", \"a.m.\", and similar) so they aren't mistaken for sentence endings. It's still a heuristic, not true language-aware sentence detection — an unlisted or unusual abbreviation can still be miscounted, and in rare cases a sentence that genuinely ends with a recognized abbreviation may be undercounted instead.",
      },
      {
        question: "Is there a limit on how much text I can paste?",
        answer:
          "There's no hard limit, but counting runs on your device as you type, so extremely large pastes (many megabytes of text) may feel briefly less responsive than typical-length text.",
      },
    ],

    edgeCaseNotes: [
      "Sentence counting recognizes common abbreviations and initialisms (titles, Latin abbreviations, a.m./p.m., multi-letter acronyms like U.S.) so they aren't miscounted as sentence endings, but it's still a heuristic, not true natural-language sentence detection — see the FAQ for the specific tradeoffs.",
      "Paragraphs are counted as blocks of text separated by at least one blank line; single line breaks within a block don't start a new paragraph.",
      "Reading and speaking time are estimates based on commonly cited average rates, not personalized to any individual's actual pace.",
    ],

    relatedTools: [],

    schemaType: "WebApplication",
    indexable: true,
    lastUpdated: "2026-09-15",
  },

  // --- Social Media Tools ---------------------------------------------
  // New "social-media-tools" category. Template-based generation, not
  // LLM-backed — every tool here fills curated sentence/hashtag
  // templates with the user's own topic, entirely client-side, no
  // backend and no API call. See PROJECT_CONTEXT.md decision log for
  // why this approach was chosen over an LLM-backed one.

  {
    slug: "instagram-hashtag-generator",
    name: "Instagram Hashtag Generator",
    category: "social-media-tools",

    title: "Free Instagram Hashtag Generator by Topic",
    metaDescription:
      "Generate relevant Instagram hashtags from a topic or keyword, free. Deduped, capped, and grounded in what you typed — not random or spammy.",
    h1: "Instagram Hashtag Generator",
    intro: "Turn a topic or keyword into a relevant, ready-to-copy set of Instagram hashtags.",

    primaryIntent: "instagram hashtag generator",
    secondaryIntents: ["hashtag generator", "instagram hashtags", "relevant hashtags", "hashtags for instagram posts"],

    faq: [
      {
        question: "How are hashtags chosen?",
        answer:
          "Hashtags are built from your topic's own words, plus a curated bank matched to common topic categories (fitness, travel, food, and others). There's no live trend data or AI involved — this runs entirely in your browser, so relevance comes from your input and the curated bank, not real-time popularity.",
      },
      {
        question: "Why does the count vary?",
        answer:
          "The generator only returns hashtags it can genuinely tie to your topic, up to a cap of 20. A very specific or uncommon topic may return fewer, more targeted hashtags rather than padding the list with unrelated ones.",
      },
      {
        question: "Is my topic sent anywhere?",
        answer: "No — hashtags are generated locally in your browser. Nothing is ever sent over the network.",
      },
    ],

    edgeCaseNotes: [
      "This is a template/keyword-matching tool, not an AI or live-trend tool — see the FAQ for exactly how hashtags are chosen.",
      "A small generic fallback bucket is used only when a topic doesn't match any curated category, and is capped so it never dominates the result.",
      "Output is capped at 20 hashtags to avoid the low-quality \"wall of hashtags\" pattern seen on many hashtag-generator sites.",
    ],

    relatedTools: ["instagram-caption-generator", "tiktok-caption-generator"],

    schemaType: "WebApplication",
    indexable: true,
    lastUpdated: "2026-09-16",
  },
  {
    slug: "instagram-caption-generator",
    name: "Instagram Caption Generator",
    category: "social-media-tools",

    title: "Free Instagram Caption Generator",
    metaDescription:
      "Generate Instagram captions from a topic, with a choice of tone, free. Includes matching hashtags and one-tap copy — all in your browser.",
    h1: "Instagram Caption Generator",
    intro: "Turn a topic into ready-to-post Instagram captions, in the tone you pick.",

    primaryIntent: "instagram caption generator",
    secondaryIntents: ["caption generator", "instagram captions", "caption ideas", "captions for instagram posts"],

    faq: [
      {
        question: "Are these captions written by AI?",
        answer:
          "No — captions are built by filling curated sentence templates with your topic, entirely in your browser. They're a starting point to edit and personalize, not a finished, uniquely-written caption.",
      },
      {
        question: "What tones are available?",
        answer: "Casual, Professional, Funny, Inspirational, and Minimal — each with its own set of templates.",
      },
      {
        question: "Is my topic sent anywhere?",
        answer: "No — everything is generated locally in your browser. Nothing is ever sent over the network.",
      },
    ],

    edgeCaseNotes: [
      "This is a template-based tool, not a generative-AI tool — see the FAQ for what that means for output variety.",
      "Hashtags shown alongside captions come from the same curated bank as the Instagram Hashtag Generator.",
    ],

    relatedTools: ["instagram-hashtag-generator", "social-media-bio-generator"],

    schemaType: "WebApplication",
    indexable: true,
    lastUpdated: "2026-09-16",
  },
  {
    slug: "youtube-title-generator",
    name: "YouTube Title Generator",
    category: "social-media-tools",

    title: "Free YouTube Title Generator",
    metaDescription:
      "Generate YouTube video title ideas from a topic, free. Choose a style — how-to, list, story, review, or challenge — all in your browser.",
    h1: "YouTube Title Generator",
    intro: "Turn a video topic into several title ideas, in the style you pick.",

    primaryIntent: "youtube title generator",
    secondaryIntents: ["youtube title ideas", "video title generator", "youtube video titles"],

    faq: [
      {
        question: "Are these titles guaranteed to perform well?",
        answer:
          "No — they're template-based starting points built from common, proven title structures (how-to, list, story, review, challenge), not a performance guarantee or an SEO analysis of your specific niche.",
      },
      {
        question: "Is my topic sent anywhere?",
        answer: "No — titles are generated locally in your browser. Nothing is ever sent over the network.",
      },
    ],

    edgeCaseNotes: [
      "This is a template-based tool — it fills common title structures with your topic, it doesn't research what's currently working on YouTube.",
    ],

    relatedTools: ["youtube-description-generator"],

    schemaType: "WebApplication",
    indexable: true,
    lastUpdated: "2026-09-16",
  },
  {
    slug: "youtube-description-generator",
    name: "YouTube Description Generator",
    category: "social-media-tools",

    title: "Free YouTube Description Generator",
    metaDescription:
      "Generate a formatted YouTube video description from a topic and key points, free. Optional hashtags and subscribe line, all in your browser.",
    h1: "YouTube Description Generator",
    intro: "Turn a topic and a few key points into a formatted, ready-to-paste YouTube description.",

    primaryIntent: "youtube description generator",
    secondaryIntents: ["youtube video description", "description generator", "youtube description template"],

    faq: [
      {
        question: "How do I enter key points?",
        answer: "Type one point per line in the key points box — each line becomes its own bullet in the description.",
      },
      {
        question: "Is my topic sent anywhere?",
        answer: "No — the description is generated locally in your browser. Nothing is ever sent over the network.",
      },
    ],

    edgeCaseNotes: [
      "This is a formatting/template tool — it structures what you type into a conventional description layout, it doesn't write new content for you beyond that structure.",
      "Hashtags, when included, come from the same curated bank as the Instagram Hashtag Generator, capped to a smaller count appropriate for a description.",
    ],

    relatedTools: ["youtube-title-generator"],

    schemaType: "WebApplication",
    indexable: true,
    lastUpdated: "2026-09-16",
  },
  {
    slug: "tiktok-caption-generator",
    name: "TikTok Caption Generator",
    category: "social-media-tools",

    title: "Free TikTok Caption Generator",
    metaDescription:
      "Generate short, punchy TikTok captions with matching hashtags from a topic, free. One-tap copy, right in your browser, no sign-up needed.",
    h1: "TikTok Caption Generator",
    intro: "Turn a topic into short, punchy TikTok captions with matching hashtags.",

    primaryIntent: "tiktok caption generator",
    secondaryIntents: ["tiktok captions", "tiktok caption ideas", "captions for tiktok"],

    faq: [
      {
        question: "How is this different from the Instagram Caption Generator?",
        answer:
          "Captions here are shorter and punchier to match TikTok convention, and come paired with a smaller hashtag set (around 6) rather than Instagram's larger set — TikTok captions conventionally use far fewer hashtags.",
      },
      {
        question: "Is my topic sent anywhere?",
        answer: "No — everything is generated locally in your browser. Nothing is ever sent over the network.",
      },
    ],

    edgeCaseNotes: [
      "This is a template-based tool, not a generative-AI or trending-sounds tool — it doesn't know what's currently trending on TikTok.",
    ],

    relatedTools: ["instagram-caption-generator", "instagram-hashtag-generator"],

    schemaType: "WebApplication",
    indexable: true,
    lastUpdated: "2026-09-16",
  },
  {
    slug: "social-media-bio-generator",
    name: "Social Media Bio Generator",
    category: "social-media-tools",

    title: "Free Social Media Bio Generator",
    metaDescription:
      "Generate a character-aware bio for Instagram, TikTok, X, or LinkedIn from a topic, free. Automatically fits each platform's character limit.",
    h1: "Social Media Bio Generator",
    intro: "Turn a topic into a bio that fits each platform's character limit — Instagram, TikTok, X, or LinkedIn.",

    primaryIntent: "social media bio generator",
    secondaryIntents: ["instagram bio generator", "tiktok bio generator", "bio ideas", "linkedin headline generator"],

    faq: [
      {
        question: "What character limits are used?",
        answer:
          "Instagram (150), TikTok (80), X (160), and LinkedIn headline (220) — these are commonly cited platform limits. Generated bios are automatically trimmed at a word boundary to fit, never cut off mid-word.",
      },
      {
        question: "Is my topic sent anywhere?",
        answer: "No — bios are generated locally in your browser. Nothing is ever sent over the network.",
      },
    ],

    edgeCaseNotes: [
      "This is a template-based tool — bios are filled from curated templates per platform, not written freshly for you.",
      "Platform character limits can change over time; the ones used here are commonly cited defaults, not fetched live from each platform.",
    ],

    relatedTools: ["instagram-caption-generator"],

    schemaType: "WebApplication",
    indexable: true,
    lastUpdated: "2026-09-16",
  },
];

export function getToolBySlug(slug: string): ToolConfig | undefined {
  return tools.find((t) => t.slug === slug);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getToolsByCategory(categorySlug: string): ToolConfig[] {
  return tools.filter((t) => t.category === categorySlug);
}

export function getIndexableTools(): ToolConfig[] {
  return tools.filter((t) => t.indexable);
}
