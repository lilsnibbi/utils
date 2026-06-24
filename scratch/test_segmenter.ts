const str = "👨‍👩‍👧‍👦🚀";
console.log("Characters:", str.length);
console.log("Array.from:", Array.from(str).length);

const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
const segments = Array.from(segmenter.segment(str), s => s.segment);
console.log("Segments:", segments.length, segments);
