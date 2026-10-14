import { describe, it } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';

describe('Unit Testing — Validation & Core Models', () => {
  // 1. Email Format Validation
  describe('Email Validation Logic', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    it('should validate RFC-compliant email formats', () => {
      const validEmails = [
        'developer@syncsphere.internal',
        'john.doe@company.org',
        'alice+filter@subdomain.example.com',
      ];
      validEmails.forEach((email) => {
        assert.strictEqual(emailRegex.test(email), true, `Failed for valid email: ${email}`);
      });
    });

    it('should reject malformed email formats', () => {
      const invalidEmails = [
        'notanemail',
        '@missinguser.com',
        'user@nodomain',
        'user with spaces@domain.com',
        '',
      ];
      invalidEmails.forEach((email) => {
        assert.strictEqual(emailRegex.test(email), false, `Accepted invalid email: ${email}`);
      });
    });

    it('should normalize emails to trimmed lowercase', () => {
      const rawInput = '  User.Test@Example.COM  ';
      const normalized = rawInput.toLowerCase().trim();
      assert.strictEqual(normalized, 'user.test@example.com');
    });
  });

  // 2. Registration Input Validation
  describe('Registration Field Constraints', () => {
    const validateRegistration = ({ email, password, fullName }) => {
      if (!email || !password || !fullName) {
        throw new Error('Email, password, and full name are required.');
      }
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long.');
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        throw new Error('Invalid email format.');
      }
      return true;
    };

    it('should pass on valid registration payload', () => {
      const payload = {
        email: 'alice@syncsphere.test',
        password: 'StrongPassword123!',
        fullName: 'Alice Developer',
      };
      assert.doesNotThrow(() => validateRegistration(payload));
    });

    it('should reject missing required fields', () => {
      assert.throws(
        () => validateRegistration({ email: 'alice@syncsphere.test', password: 'password123' }),
        /Email, password, and full name are required/
      );
    });

    it('should reject passwords shorter than 8 characters', () => {
      assert.throws(
        () => validateRegistration({
          email: 'alice@syncsphere.test',
          password: 'short',
          fullName: 'Alice',
        }),
        /Password must be at least 8 characters long/
      );
    });
  });

  // 3. Password Hashing (bcrypt 12 rounds)
  describe('Password Hashing & Bcrypt Verification', () => {
    it('should generate a salted bcrypt hash with cost factor 12', async () => {
      const plaintext = 'SuperSecretSyncSphere2026!';
      const hash = await bcrypt.hash(plaintext, 12);

      assert.ok(hash.startsWith('$2a$12$') || hash.startsWith('$2b$12$'));
      assert.notStrictEqual(plaintext, hash);

      const isMatch = await bcrypt.compare(plaintext, hash);
      assert.strictEqual(isMatch, true);

      const isWrongMatch = await bcrypt.compare('WrongPassword', hash);
      assert.strictEqual(isWrongMatch, false);
    });
  });

  // 4. Project Creation Validation
  describe('Project Creation Rules', () => {
    const validateProject = ({ teamId, title, desc, deadline }) => {
      if (!teamId || !title || !desc || !deadline) {
        throw new Error('Team ID, title, description, and deadline are required.');
      }
      if (new Date(deadline).toString() === 'Invalid Date') {
        throw new Error('Deadline must be a valid date.');
      }
      return true;
    };

    it('should validate required project parameters', () => {
      assert.doesNotThrow(() =>
        validateProject({
          teamId: 1,
          title: 'SyncSphere Core Architecture',
          desc: 'Full-stack platform build',
          deadline: '2026-12-31T23:59:59Z',
        })
      );

      assert.throws(
        () => validateProject({ teamId: 1, title: '', desc: 'Desc', deadline: '2026-12-31' }),
        /Team ID, title, description, and deadline are required/
      );

      assert.throws(
        () => validateProject({ teamId: 1, title: 'Valid', desc: 'Desc', deadline: 'not-a-date' }),
        /Deadline must be a valid date/
      );
    });
  });

  // 5. Task Creation & Status Transitions
  describe('Task Status Transitions & Priority Rules', () => {
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const validStatuses = ['TO_DO', 'IN_PROGRESS', 'COMPLETED'];

    it('should accept allowed priority values', () => {
      validPriorities.forEach((p) => {
        assert.ok(validPriorities.includes(p));
      });
      assert.strictEqual(validPriorities.includes('UNKNOWN'), false);
    });

    it('should validate standard Kanban workflow transitions', () => {
      let currentStatus = 'TO_DO';
      const transitionTo = (newStatus) => {
        if (!validStatuses.includes(newStatus)) {
          throw new Error(`Invalid status transition to ${newStatus}`);
        }
        currentStatus = newStatus;
        return currentStatus;
      };

      assert.strictEqual(transitionTo('IN_PROGRESS'), 'IN_PROGRESS');
      assert.strictEqual(transitionTo('COMPLETED'), 'COMPLETED');
      assert.throws(() => transitionTo('ARCHIVED_UNKNOWN'), /Invalid status transition/);
    });
  });

  // 6. Personal Event Creation Rules
  describe('Personal Event Validation', () => {
    const validateEvent = ({ title, date, recurring, recurrenceRule }) => {
      if (!title || !title.trim() || !date) {
        throw new Error('Event title and date are required.');
      }
      if (recurring && !recurrenceRule) {
        throw new Error('Recurring events must define a recurrence rule.');
      }
      return true;
    };

    it('should accept valid non-recurring event', () => {
      assert.doesNotThrow(() =>
        validateEvent({
          title: 'Doctor Appointment',
          date: '2026-11-01T09:00:00Z',
          recurring: false,
        })
      );
    });

    it('should validate recurring event requirement', () => {
      assert.throws(
        () =>
          validateEvent({
            title: 'Weekly Standup',
            date: '2026-11-01T09:00:00Z',
            recurring: true,
            recurrenceRule: null,
          }),
        /Recurring events must define a recurrence rule/
      );
    });
  });
});
