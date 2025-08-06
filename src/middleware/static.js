import express from "express";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const configureStatic = (app) => {
  app.use(express.static(path.join(__dirname, "../../public")));
  app.use('/css', express.static(path.join(__dirname, '../../node_modules/bootstrap/dist/css')));
  app.use('/css', express.static(path.join(__dirname, '../../node_modules/bootstrap-icons/font')));
  app.use('/css', express.static(path.join(__dirname, '../../node_modules/simplebar/dist')));
  app.use('/js', express.static(path.join(__dirname, '../../node_modules/bootstrap/dist/js')));
  app.use('/js', express.static(path.join(__dirname, '../../node_modules/jquery/dist')));
  app.use('/js', express.static(path.join(__dirname, '../../node_modules/sortablejs')));
  app.use('/js', express.static(path.join(__dirname, '../../node_modules/simplebar/dist')));
  app.use('/js', express.static(path.join(__dirname, '../../node_modules/jquery-sortablejs')));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
};
