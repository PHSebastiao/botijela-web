import passport from "passport";
import OAuth2Strategy from "passport-oauth2";

export default function configurePassport(
  TWITCH_CLIENT_ID,
  TWITCH_SECRET,
  GENERAL_CALLBACK_URL,
  ADVANCED_CALLBACK_URL,
  API_URL
) {
  OAuth2Strategy.prototype.userProfile = function (accessToken, done) {
    var options = {
      url: "https://api.twitch.tv/helix/users",
      method: "GET",
      headers: {
        "Client-ID": TWITCH_CLIENT_ID,
        Accept: "application/vnd.twitchtv.v5+json",
        Authorization: "Bearer " + accessToken,
      },
    };

    fetch(options.url, {
      method: options.method,
      headers: options.headers,
    })
      .then(async (response) => {
        if (response.ok) {
          return response.json();
        }
        const err = await response.json();
        return await Promise.reject(err);
      })
      .then((data) => {
        done(null, data);
      })
      .catch((error) => {
        done(error);
      });
  };
  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user);
  });

  const createTwitchStrategy = (clientId, secret, callbackUrl, scope) => {
    const strategy = new OAuth2Strategy(
      {
        authorizationURL: "https://id.twitch.tv/oauth2/authorize",
        tokenURL: "https://id.twitch.tv/oauth2/token",
        clientID: clientId,
        clientSecret: secret,
        callbackURL: callbackUrl,
        scope: scope,
        state: true,
      },
      function (accessToken, refreshToken, params, profile, done) {
        const userProfile = profile.data[0];
        const user = {
          userId: userProfile.id,
          username: userProfile.login,
          displayName: userProfile.display_name,
          obtainmentTimestamp: Date.now(),
          expiresIn: params.expires_in,
          accessToken,
          refreshToken,
          scope: params.scope,
        };
        // todo: send user to ${API_URL}/auth/user
        console.log(user);
        done(null, user);
      }
    );

    return strategy;
  };

  passport.use(
    "general",
    createTwitchStrategy(
      TWITCH_CLIENT_ID,
      TWITCH_SECRET,
      GENERAL_CALLBACK_URL,
      "channel:bot chat:read user:read:moderated_channels moderator:read:followers channel:read:redemptions channel:manage:redemptions channel:read:subscriptions"
    )
  );

  passport.use(
    "advanced",
    createTwitchStrategy(
      TWITCH_CLIENT_ID,
      TWITCH_SECRET,
      ADVANCED_CALLBACK_URL,
      "channel:bot chat:read chat:edit channel:read:redemptions channel:manage:redemptions channel:manage:moderators channel:edit:commercial channel:manage:raids channel:read:subscriptions channel:manage:vips moderator:manage:banned_users moderator:read:shoutouts moderator:manage:shoutouts moderator:read:chatters moderator:read:followers moderation:read user:manage:chat_color channel:read:predictions channel:manage:predictions user:write:chat user:manage:whispers user:read:whispers"
    )
  );

  return passport;
}
