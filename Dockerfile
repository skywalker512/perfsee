FROM node:lts AS server

LABEL org.opencontainers.image.source "https://github.com/skywalker512/perfsee"

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
  DEBIAN_FRONTEND="noninteractive"

SHELL ["/bin/bash", "-c"]

RUN cat /etc/apt/sources.list && \
  apt-get update && \
  apt-get install procps curl unzip git libsecret-1-dev ca-certificates gnupg2 -y --no-install-recommends --fix-missing

FROM server AS runner
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
RUN curl -sS https://dl.google.com/linux/linux_signing_key.pub | apt-key add - && \
  echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list && \
  apt-get update && \
  apt-get install xvfb libjpeg-dev ffmpeg google-chrome-stable -y --no-install-recommends --fix-missing

FROM runner AS develop
ENV RUSTUP_HOME=/usr/local/rustup \
  CARGO_HOME=/usr/local/cargo \
  PATH=/usr/local/cargo/bin:$PATH
RUN apt-get install build-essential -y --no-install-recommends --fix-missing
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

FROM develop as compose_develop
ADD . /code
WORKDIR /code
RUN yarn

FROM server as build
ADD . /code
WORKDIR /code
RUN source ~/.bashrc && yarn && yarn build && \
  cd docs && yarn && yarn build && cd .. && \
  npx @vercel/ncc build packages/platform-server/src/index.ts -t -d --v8-cache --target es2020

FROM node:lts as deploy
WORKDIR /app
COPY --from=build /code/dist /app/
COPY --from=build /code/assets /app/assets
RUN install -D /dev/null node_modules/typeorm/index.js && \
  install -D /dev/null node_modules/@nestjs/typeorm/index.js
EXPOSE 3000
CMD ["node", "index.js"]

FROM runner as runner_deploy
ADD . /code
WORKDIR /code
RUN yarn && yarn build
CMD ["node", "-r", "./tools/paths-register", "packages/job-runner/dist/index.js"]
