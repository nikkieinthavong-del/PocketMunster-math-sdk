"""Test file decompression and validate data structure is valid JSON."""

import json
import zstandard as zstd


def decompress(input_path: str, save_output: bool = False):
    """Decompress zst files assuming newline char to indicate different sims."""

    def json_validate(json_blob):
        """Validate each uncompressed result to ensure valid json format."""
        try:
            _ = json.loads(json_blob)
        except json.decoder.JSONDecodeError:
            print("Invalid JSON!")
            raise RuntimeError("Invalid JSON")

    decompressor = zstd.ZstdDecompressor()
    with open(input_path, "rb") as f:
        with decompressor.stream_reader(f) as reader:
            decompressed_data = reader.read().decode("utf-8")

    all_sims = decompressed_data.split("\n")
    for sim in all_sims:
        if sim.strip():
            json_validate(sim)

    if save_output:
        with open("decompressed.jsonl", "w", encoding="UTF-8") as f:
            f.write(json.dumps(decompressed_data, indent=4))


if __name__ == "__main__":

    test_file = "utils/books_base.jsonl.zst"
    decompress(test_file, save_output=True)
