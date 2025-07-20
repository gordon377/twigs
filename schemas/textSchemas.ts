import * as v from 'valibot';

// Individual field schemas
export const displayNameSchema = v.pipe(
  v.string("Invalid: Enter a string"),
  v.nonEmpty("Display Name cannot be empty"),
);

export const usernameSchema = v.pipe(
  v.string("Invalid: Enter a string"),
  v.nonEmpty("User ID cannot be empty"),
);

export const emailSchema = v.pipe(
  v.string("Invalid: Enter a string"),
  v.nonEmpty("Email cannot be empty"),
  v.email("Please enter a valid email address"),
);

export const passwordSchema = v.pipe(
  v.string("Invalid: Enter a string"),
  v.minLength(8, "Password must be at least 8 characters"),
  v.regex(/[a-z]/, 'Your password must contain a lowercase letter.'),
  v.regex(/[A-Z]/, 'Your password must contain a uppercase letter.'),
  v.regex(/[0-9]/, 'Your password must contain a number.'),
  v.regex(/[^A-Za-z0-9]/, 'Your password must contain a special character.'),
);

export const phoneNumSchema = v.pipe(
  v.number("Must use numbers only for your Phone Number"),
);

export const bioSchema = v.pipe(
  v.string("Invalid: Enter a string"),
  v.nonEmpty("Bio cannot be empty"),
  v.maxLength(100, "Bio cannot be more than 100 characters"),
);

// Combined schema (optional, for full object validation)
export const signUpSchemas = v.object({
  displayName: displayNameSchema,
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  phoneNumber: phoneNumSchema,
  bio: bioSchema,
});

export function signUpParsed(data: any) {
  return v.parse(signUpSchemas, data);
}

export const LoginSchema = v.object({
    email: v.pipe(
      v.string("Invalid: Enter a string"),
      v.nonEmpty("Email cannot be empty"),
      v.email("Please enter a valid email address"),
    ),
    password: v.pipe(
      v.string("Invalid: Enter a string"),
      v.nonEmpty("Password cannot be empty"),
    ),
  });

export function logInParsed (data: any) {
  return v.parse(LoginSchema, data);
}