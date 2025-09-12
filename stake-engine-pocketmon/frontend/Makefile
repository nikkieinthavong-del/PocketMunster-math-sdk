# Proxy Makefile to allow running `make pack` from frontend directory
.PHONY: pack
pack:
	$(MAKE) -C ../.. pack PACK_NAME="$(PACK_NAME)" PACK_SKIP_BUILD="$(PACK_SKIP_BUILD)"