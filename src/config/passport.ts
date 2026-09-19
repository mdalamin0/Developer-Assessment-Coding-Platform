import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import {
  Strategy as GoogleStrategy,
  type Profile,
} from "passport-google-oauth20";
import { prisma } from "../lib/prisma";
import { AuthProvider, Role, UserStatus } from "../../generated/prisma/enums";
import bcrypt from "bcryptjs";
import config from ".";
import path from "path";
import { transporter } from "../lib/nodemailer";
import ejs from "ejs";

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return done(null, false, {
            message: "Invalid email or password",
          });
        }

        if (user.status === UserStatus.SUSPENDED) {
          return done(null, false, {
            message: "User is suspended!",
          });
        }

        if (user.provider === AuthProvider.GOOGLE && !user.password) {
          return done(null, false, {
            message:
              "This account is registered with Google. Please login with Google.",
          });
        }

        const isPasswordMatched = await bcrypt.compare(
          password,
          user.password!,
        );

        if (!isPasswordMatched) {
          return done(null, false, {
            message: "Invalid email or password",
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google_client_id,
      clientSecret: config.google_client_secret,
      callbackURL: config.google_callback_url,
    },

    async (accessToken, refreshToken, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(null, false, {
            message: "Google account email not found",
          });
        }

        const existingUserAnyRole = await prisma.user.findFirst({
          where: { email },
        });

        if (
          existingUserAnyRole &&
          existingUserAnyRole.role !== Role.CANDIDATE
        ) {
          return done(null, false, {
            message: "Google login is only allowed for Candidates.",
          });
        }

        let user = existingUserAnyRole;

        if (existingUserAnyRole) {
          if (existingUserAnyRole.status === UserStatus.SUSPENDED) {
            return done(null, false, { message: "User is suspended" });
          }
          if (existingUserAnyRole.status === UserStatus.DELETED) {
            return done(null, false, { message: "User is deleted!" });
          }

         
          if (!existingUserAnyRole.googleId) {
            user = await prisma.user.update({
              where: { id: existingUserAnyRole.id },
              data: {
                googleId: profile.id,
                image: profile.photos?.[0]?.value,
                emailVerified: true,
              },
            });
          }
        }

        else {
          user = await prisma.user.create({
            data: {
              name: profile.displayName,
              email,
              role: Role.CANDIDATE,
              googleId: profile.id,
              provider: AuthProvider.GOOGLE,
              emailVerified: true,
              image: profile.photos?.[0]?.value,
              candidate: {
                create: {},
              },
            },
            include: {
              candidate: true,
            },
          });

        
          try {
            const templatePath = path.join(
              process.cwd(),
              "src/templates/user-welcome-email.ejs",
            );
            const templateData = { name: user.name };
            const html = await ejs.renderFile(templatePath, templateData);

            await transporter.sendMail({
              from: config.email_sender,
              to: email,
              subject: "Welcome To developer assessment & coding platform.",
              html,
            });
          } catch (error) {
            console.error("Failed to send welcome email:", error);
          }
        }

        if (!user) {
          return done(null, false, { message: "User not found!" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);



export default passport;
