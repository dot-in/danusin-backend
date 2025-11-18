import { RowDataPacket, ResultSetHeader } from "mysql2";
import { User, Product, Order, Notification } from "./common.types.js";

export interface UserRow extends RowDataPacket, User {}
export interface ProductRow extends RowDataPacket, Product {}
export interface OrderRow extends RowDataPacket, Order {}
export interface NotificationRow extends RowDataPacket, Notification {}

export type QueryResult<T> = T & RowDataPacket;
export type InsertResult = ResultSetHeader;
