import { Request, Response } from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  upgradeToSeller,
} from "../services/auth.service.js";

export async function registerController(req: Request, res: Response) {
  const user = await register(req.body);
  res.status(201).json({ message: "Registrasi berhasil", user });
}

export async function loginController(req: Request, res: Response) {
  const { credential, password } = req.body;
  if (!credential || !password) {
    return res
      .status(400)
      .json({ message: "Credential dan password wajib diisi" });
  }
  const data = await login({ credential, password });
  res.json(data);
}

export async function profileController(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const profile = await getProfile(req.user.id);
  res.json(profile);
}

export async function updateProfileController(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const updatedUser = await updateProfile(req.user.id, req.body);
  res.json({ message: "Profil berhasil diperbarui", user: updatedUser });
}

export async function upgradeSellerController(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const { whatsapp } = req.body;
  const updated = await upgradeToSeller(req.user.id, whatsapp);
  res.json({ message: "Upgrade berhasil", user: updated });
}
