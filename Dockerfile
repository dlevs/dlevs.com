FROM node:10.16.0-alpine

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

USER node

RUN npm ci

# TODO: is building always a manual step?
# RUN npm run build

COPY --chown=node:node . .

EXPOSE $PORT

CMD [ "node", "index.js" ]
