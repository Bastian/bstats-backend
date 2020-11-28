FROM node:14

WORKDIR /app

COPY . .

# Install app dependencies and build application
RUN npm install
RUN npm i -g @nestjs/cli
RUN npm run build

# We have to set the environment variable afterwards or it will not be able to
# build the project.
ENV NODE_ENV=production

EXPOSE 3001

CMD [ "npm", "run", "start:prod" ]