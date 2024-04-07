import { Router } from "express";
import { Users } from "../dao/models/index.js";
import { uploadDocument } from "../helpers/multer.js";
import { UserDto } from "../dto/users.js";
import { CustomError } from "../utils/CustomError.js";
import { logger } from "../config/logger.js";

const user = Router();

user
  .post("/premium/:uid", async (req, res, next) => {
    try {
      const { uid } = req.params;
      const { role } = req.body;

      const user = await Users.findOne({ _id: uid });
      if (!user) {
        return res.status(404).json({ message: "Missed user" });
      }

      if (role === "premium" && user.role === "user") {
        const requiredDocuments = [
          "identification",
          "proofOfResidence",
          "bankStatement",
        ];

        const hasAllRequiredDocuments = requiredDocuments.every((docName) =>
          user.documents.some((doc) => doc.name === docName)
        );

        if (!hasAllRequiredDocuments) {
          return res
            .status(400)
            .json({ message: "The process of uploading documents has failed" });
        }

        user.role = "premium";
        await user.save();

        res.json({ message: "User is now premium member!" });
      } else if (role === "user" && user.role === "premium") {
        user.role = "user";
        await user.save();

        res.json({ message: "User is no longer a premium member." });
      } else {
        res.status(400).json({ message: "The request is not valid" });
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  })
  .post(
    "/:uid/documents",
    uploadDocument.fields([
      { name: "document" },
      { name: "profile" },
      { name: "product" },
      { name: "identification" },
      { name: "proofOfResidence" },
      { name: "bankStatement" },
    ]),
    async (req, res, next) => {
      try {
        const { uid } = req.params;
        const baseUrl = "http://localhost:8080/uploads";

        let documents = Object.keys(req.files)
          .map((fileKey) => {
            const fileData = req.files[fileKey][0];
            if (fileData) {
              const documentUrl = `${baseUrl}/${uid}/${fileKey}/${fileData.filename}`;

              const document = {
                name: fileKey,
                reference: documentUrl,
              };
              return document;
            }
          })
          .filter((update) => update);

        if (documents.length === 0) {
          throw new Error("At least one document is required.");
        }

        await Users.updateOne({ _id: uid }, { documents });

        res.json({
          message: "Documents uploaded successfully with URLs.",
          documents,
        });
      } catch (error) {
        next(error);
      }
    }
  )
  .get("/", async (req, res, next) => {
    try {
      const { id = null } = req.query;
      if (id) {
        const user = await Users.findById(id);
        if (!user) {
          logger.warning(`User ID: ${req.query} not found`);
          return CustomError.create({
            name: `User ID: ${req.params.cid} not found`,
            status: statusError.NOT_FOUND,
            message: messageError.NOT_FOUND,
          });
        }
        return res.send(new UserDto(user));
      }
      const users = await Users.find();
      const usersFormatted = users.map((u) => new UserDto(u));
      res.send(usersFormatted);
    } catch (error) {
      next(error);
    }
  })
  .delete("/", async (req, res, next) => {
    try {
      const users = await Users.find();
      const dateNow = new Date();

      await Promise.all(
        users.map(async (u) => {
          const date = new Date(u.last_connection);
          const diff = dateNow - date;
          if (Math.abs(diff / (1000 * 60 * 60 * 24)) > 2) {
            await Users.deleteMany({ _id: u._id });
          }
        })
      );
      const lastUsers = await Users.find();
      res.send(lastUsers);
    } catch (error) {
      next(error);
    }
  });

export default user;
