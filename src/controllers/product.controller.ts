import { Request, Response } from "express";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProduct,
  listProducts,
  listSellerProducts,
} from "../services/product.service.js";

export async function createProductController(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const product = await createProduct(req.user.id, req.body);
  res.status(201).json({ message: "Produk berhasil dibuat", product });
}

export async function updateProductController(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const productId = req.params.id;
  const result = await updateProduct(req.user.id, Number(productId), req.body);
  res.json(result);
}

export async function deleteProductController(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const productId = req.params.id;
  const result = await deleteProduct(req.user.id, Number(productId));
  res.json(result);
}

export async function getProductController(req: Request, res: Response) {
  const productId = req.params.id;
  const product = await getProduct(Number(productId));
  res.json(product);
}

export async function listProductsController(req: Request, res: Response) {
  const products = await listProducts(req.query as any);
  res.json(products);
}

export async function listSellerProductsController(
  req: Request,
  res: Response
) {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const products = await listSellerProducts(req.user.id);
  res.json(products);
}
