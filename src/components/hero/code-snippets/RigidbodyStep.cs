using UnityEngine;

// Semi-implicit Euler step with a soft ground contact.
public sealed class BodyIntegrator : MonoBehaviour
{
    [SerializeField] float mass = 1.2f;
    [SerializeField] float drag = 0.08f;
    [SerializeField] float restitution = 0.35f;
    [SerializeField] Vector2 gravity = new Vector2(0f, -9.81f);

    Vector2 velocity;
    Vector2 accumulated;

    public void AddForce(Vector2 force) => accumulated += force;

    void FixedUpdate()
    {
        float dt = Time.fixedDeltaTime;
        Vector2 accel = gravity + accumulated / mass;
        velocity += accel * dt;
        velocity *= 1f / (1f + drag * dt);

        Vector2 next = (Vector2)transform.position + velocity * dt;
        if (next.y < 0f)
        {
            next.y = -next.y * restitution;
            velocity.y = -velocity.y * restitution;
            velocity.x *= 0.92f;
        }

        transform.position = next;
        accumulated = Vector2.zero;
    }

    public float KineticEnergy()
    {
        return 0.5f * mass * velocity.sqrMagnitude;
    }

    void OnDrawGizmosSelected()
    {
        Gizmos.color = Color.cyan;
        Vector3 p = transform.position;
        Gizmos.DrawLine(p, p + (Vector3)velocity * 0.25f);
    }
}
