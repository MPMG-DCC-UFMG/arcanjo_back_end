FROM node:16-alpine

WORKDIR /usr/src/arcanjo
COPY . .
RUN npm install
RUN npm run build

EXPOSE 4545

CMD [ "npm", "start" ]
