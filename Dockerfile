FROM node:18
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm update && npm ci

# Bundle app source
COPY . .

CMD [ "npm", "start" ]