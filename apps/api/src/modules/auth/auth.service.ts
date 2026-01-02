import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { HttpError } from "../../server/httpError.js";
import { UserModel } from "./user.model.js";

function jwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET saknas i env.");
  return s;
}

export async function login(epost: string, losen: string) {
  const user = await UserModel.findOne({ epost: epost.toLowerCase() }).lean();
  if (!user) throw new HttpError(401, "Fel e-post eller lösenord.");

  const ok = await bcrypt.compare(losen, user.losenHash);
  if (!ok) throw new HttpError(401, "Fel e-post eller lösenord.");

  const token = jwt.sign(
    { sub: String(user._id), roll: user.roll, employeeId: user.employeeId ?? null },
    jwtSecret(),
    { expiresIn: "12h" }
  );

  return {
    token,
    user: { id: String(user._id), epost: user.epost, roll: user.roll, employeeId: user.employeeId ?? null },
  };
}
