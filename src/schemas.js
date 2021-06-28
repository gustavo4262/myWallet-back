import Joi from "joi";

export const userSignUpSchema = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().required(),
  password: Joi.string().required(),
});

export const userSignInSchema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().required(),
});

export const revenueSchema = Joi.object({
  value: Joi.number().required(),
  description: Joi.string().required(),
});
