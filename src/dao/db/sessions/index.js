import { Users } from "../../models/index.js";
import bcrypt from "bcrypt";

export const login = async (req, res) => {
  //try {
  //const { email, password } = req.body;
  //if (!email || !password) {
  //  return res
  //    .status(400)
  //    .send({ message: "Todos los campos son requeridos" });
  //}
  //const user = await Users.findOne({ email });
  //if (!user)
  //  return res.status(401).send({ message: "Correo o contraseña invalidos" });
  //const isMatch = await bcrypt.compare(password, user.password);
  //if (!isMatch)
  //  return res.status(401).send({ message: "Correo o contraseña invalidos" });
  //req.session.user = {
  //  nombre: user.firstName,
  //  apellido: user.lastName,
  //  email: user.email,
  //  edad: user.age,
  //  rol: user.role === "admin" ? "admin" : "user",
  //};
  //res.redirect("/api/views/products");
  //} catch (error) {
  //  console.log("Error en el servicio de autenticacion", error);
  //  res.status(500).send({ message: "Algo salio mal" });
  //}
};

export const logout = async (req, res) => {
  try {
    req.session.destroy(async (error) => {
      if (error) {
        return res.send({
          message: "Hubo un error al cerrar sesión",
          error: error,
        });
      }

      const { email } = req.user;
      const user = await Users.findOne({ email });
      const dateNow = new Date();
      user.last_connection = dateNow;
      user.save();

      res.clearCookie("token");
      res.redirect("/api/views/login");
    });
  } catch (error) {
    console.log(error);
  }
};

export const register = async (req, res) => {
  //try {
  //const { firstName, lastName, email, password, age } = req.body;
  //if (!firstName || !lastName || !email || !password || !age) {
  //  return res
  //    .status(400)
  //    .send({ message: "Todos los campos son requeridos" });
  //}
  //const hashedPassword = await bcrypt.hash(password, 10);
  //await Users.create({
  //  firstName,
  //  lastName,
  //  email,
  //  password: hashedPassword,
  //  age,
  //});
  //res.redirect("/api/views/login");
  //} catch (error) {
  //  console.log("Error en el registro", error);
  //  res.status(500).send({ message: "Hubo un error al registrar usuario" });
  //}
};

export const profile = async (req, res) => {
  try {
    if (!req.user) return res.redirect("/api/views/login");

    res.render("profile", { user: req.user });
  } catch (error) {
    console.log("error", error);
    res.status(500).send({ message: "Ocurrio un error" });
  }
};
