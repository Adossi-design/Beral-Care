import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Icon } from '../components/ui';
import { useI18n } from '../lib/i18n';

// The fuller story behind the project. The rest of the site stays focused on
// using the platform, so the background lives here rather than on every page.
export default function About() {
  const { t } = useI18n();

  return (
    <div className="public">
      <header className="pubnav">
        <Link to="/" className="pubnav__brand">
          <span className="brand-mark"><Icon name="heart" size={18} /></span>
          <span className="pubnav__name">Beral Care</span>
        </Link>
        <nav className="pubnav__links">
          <Link className="pubnav__link" to="/">Home</Link>
          <Button to="/login" size="sm">{t('signIn')}</Button>
          <Button to="/register" variant="primary" size="sm">{t('signUp')}</Button>
        </nav>
      </header>

      <main className="section-pad">
        <div className="section-inner prose">
          <h1 className="about__title">Why this exists</h1>

          <p className="about__lede">
            Beral Care started with something that happened to me, not with a
            list of technologies I wanted to try.
          </p>

          <p>
            I was being treated at Kanombe Military Hospital here in Rwanda, and
            I needed information about my earlier treatment. The doctor who had
            been treating me was attending meetings, and I was told she would not
            be available for several weeks, until the following month.
          </p>

          <p>
            Her being unavailable was not really the problem. I was sick at the
            time, and what troubled me was that I could not get hold of my own
            medical information so that I could go and look for help somewhere
            else. I waited, still in pain, until she came back and could tell me
            what I needed to know.
          </p>

          <p>
            Afterwards I kept thinking about what would have happened if my
            condition had been more serious, or if I had urgently needed a
            different doctor who knew nothing about what had already happened to
            me.
          </p>

          <p>
            There was a second version of the same problem. I have been given
            medical papers before and lost some of them later, and once enough
            time passes it becomes hard to remember what condition you had, what
            medicine you were given, or what the doctor told you. When I looked
            around, I saw relatives, siblings, cousins, and other people close to
            me running into the same thing. That is when it stopped being a
            personal inconvenience and started looking like a problem I could
            build something around.
          </p>

          <h2 className="about__h2">What I wanted to build first</h2>

          <p>
            The first idea was much smaller than what exists today. I wanted
            people to have one place to keep their medical history, so that
            someone could look back several years later and still know what
            happened during a visit, what was diagnosed, what medicine they were
            given, and which doctor treated them. Your health information should
            not become useless because a piece of paper went missing.
          </p>

          <p>
            That is still the centre of the platform. Everything else grew
            around it. You get a health ID that stays yours, your records stay
            with you rather than with one building, and you can print them,
            because not every clinic will use this platform and you should still
            be able to take something useful with you.
          </p>

          <h2 className="about__h2">You decide who reads it</h2>

          <p>
            Putting health information online creates a problem that paper never
            had. Easier to reach should not mean available to everyone, so a
            doctor cannot simply look up your health ID and start reading. They
            ask, you decide, and you can see who has access and stop sharing at
            any time. The check happens on the server, so it is not something
            the website can be talked out of.
          </p>

          <p>
            The same rule applies to the AI. MedAssist only receives a patient's
            history after the server has confirmed that patient approved that
            doctor, so the assistant cannot become a way around your decision.
          </p>

          <h2 className="about__h2">Reaching people without smartphones</h2>

          <p>
            If this only worked on a modern phone with good internet, it would
            leave out some of the people I most want it to help. That is why the
            main services also work over USSD, using a short code from a basic
            phone with no internet at all, reading and writing the same records
            as the website. Accessibility should be visible in how the system is
            built, not just mentioned somewhere and then forgotten.
          </p>

          <h2 className="about__h2">Understanding, not just access</h2>

          <p>
            The assistants came later, once the records themselves worked. They
            answer a question that only appears after the first problem is
            solved: what happens when you can finally reach your information but
            still do not understand it. HealthGuide explains your diagnosis and
            your medicine in plain words and helps you think of questions for
            your next visit. MedAssist supports doctors during a consultation.
          </p>

          <p>
            Neither is a doctor. HealthGuide will not diagnose you, will not tell
            you to change your medicine, and sends anything that sounds serious
            back to a qualified professional. For mental health it can listen and
            offer general support, but it is not a psychologist, a psychiatrist,
            or an emergency service, and it will say so.
          </p>

          <h2 className="about__h2">Where this actually stands</h2>

          <p>
            This is a prototype built by one student, and I would rather be
            straight about that. Nobody is using it for real care. The accounts
            in it are demonstration accounts. No health professional has reviewed
            it, it has not been through any privacy or regulatory assessment, and
            it is not ready to hold real patient information.
          </p>

          <p>
            Before something like this could responsibly serve real people, it
            would need a proper security review, doctors judging whether the
            clinical parts are useful and safe, real patients testing whether it
            actually makes sense to them, and research to check whether the
            assumptions behind it match what people experience. I have not solved
            healthcare. I have an early answer to a problem I ran into myself,
            and a much clearer view of what would need to happen next.
          </p>

          <p>
            The idea came from my own experience in Rwanda, and I am interested
            in whether it is useful more widely across Africa, particularly where
            distance, cost, connectivity, or the availability of specialists make
            care harder to reach. Health systems differ a great deal from one
            country to another, so I am not claiming to know how they all work.
          </p>

          <div className="about__cta">
            <Button to="/register" variant="primary" size="lg" iconRight="arrowRight">
              Create a free account
            </Button>
            <Button to="/" size="lg">Back to home</Button>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="footer__inner">
          <div className="row gap-3">
            <span className="brand-mark"><Icon name="heart" size={16} /></span>
            <div>
              <div style={{ color: '#fff', fontWeight: 650 }}>Beral Care</div>
              <div className="text-xs">Health care and health records for everyone</div>
            </div>
          </div>
          <div className="text-xs">Built by Adossi Fred William</div>
        </div>
      </footer>
    </div>
  );
}
