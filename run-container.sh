docker run --rm -it \
 --network host \
 --volume ./audio:/audio \
 --volume ./.baresip:/root/.baresip \
 yt-dlp-call "$@"

sudo rm -fr ./audio