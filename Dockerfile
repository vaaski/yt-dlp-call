FROM ghcr.io/baresip/docker/baresip-dev:latest

RUN apt update && apt install curl ffmpeg -y
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/bin/yt-dlp
RUN chmod a+rx /usr/bin/yt-dlp

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt install -y nodejs

RUN curl -fsSL https://get.pnpm.io/install.sh | ENV="$HOME/.bashrc" SHELL="$(which bash)" bash -

WORKDIR /app
COPY package.json pnpm-lock.yaml yt-dlp-call-container.ts .

RUN /root/.local/share/pnpm/pnpm install --frozen-lockfile

ENTRYPOINT ["/root/.local/share/pnpm/pnpm", "exec", "tsx", "yt-dlp-call-container.ts"]
